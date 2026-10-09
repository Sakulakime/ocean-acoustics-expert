function ok = validate_bellhop_env( envfile )
% VALIDATE_BELLHOP_ENV  Line-level sanity checker for a BELLHOP .env file.
%
%   ok = validate_bellhop_env( envfile )
%
% PURPOSE
%   The Acoustics Toolbox (AT) reader (read_env_core.m / read_bell.m) parses
%   .env files with Fortran free-format fscanf. When a file is malformed the
%   reader either errors deep in the stack or, worse, silently de-syncs and
%   produces a corrupt run. This validator front-runs BELLHOP and reports
%   EVERY problem it finds with the offending line number and a concrete fix
%   hint, so an AI agent or a user cannot easily launch a malformed run.
%
%   It deliberately re-implements a line-tracking parser (the raw AT reader
%   gives no line numbers) but follows the exact same parsing rules so the
%   diagnostics match what BELLHOP will actually do.
%
% INPUT
%   envfile : char row vector or string scalar.
%             Path to the .env case file. The ".env" extension is optional;
%             if absent it is appended (matching read_env.m behaviour).
%
% OUTPUT
%   ok      : logical scalar.
%             true  -> no FAIL-level problems were found (WARN may still print).
%             false -> at least one FAIL-level problem; do NOT run BELLHOP.
%
% CHECKS PERFORMED (FAIL unless noted)
%   - Title / top-opt / bottom-opt / run-type are wrapped in single quotes.
%   - Frequency > 0, NMEDIA >= 1.
%   - SSP interpolation letter (top-opt char 1) and attenuation-units letter
%     (top-opt char 3) are valid AT letters.
%   - Conditional lines are present/absent consistently: Francois-Garrison
%     line iff top-opt char 4 == 'F'; bottom halfspace line iff bottom-opt
%     char 1 == 'A'; Cerveny trailer (2 lines) iff run-type char 2 in {C,R}.
%   - SSP depths strictly increasing within each medium.
%   - SSP block termination rule: the LAST SSP row depth must EQUAL the medium
%     bottom depth on the "N sigma depth" header (read_env_core.m:191). This is
%     the true terminator, not the declared point count N.
%   - Declared mesh-point count N vs actual SSP row count: reported as INFO
%     only, because N is finite-difference mesh points, not a row count.
%   - NSD / NRD / NR declared counts are consistent with their value rows,
%     accounting for the '/' linspace shorthand (readvector.m).
%   - Trailing '/' present on SSP rows and on the source/receiver/range value
%     rows where the canonical writer emits it (WARN if missing).
%   - Run-type calculation letter (char 1) is a valid AT letter.
%   - ZBOX (m) exceeds the deepest receiver/SSP depth and RBOX (km) exceeds the
%     max receiver range.
%   - Range block looks like km, not m (heuristic WARN).
%
% NOTE ON SCOPE
%   This validates single-environment BELLHOP files (model = 'BELLHOP'). It is
%   not intended for SCOOTER/KRAKEN/SPARC files (which carry extra cLow/cHigh
%   and RMax lines) nor for multi-environment batch files such as wedge.env.
%
% SEE ALSO
%   run_bellhop, read_env, read_env_core, read_bell, readvector

    % ---- default tuning constants (documented, no bare magic numbers) -------
    DEF.minCp          = 1400.0;   % m/s   plausible lower bound for a sound speed
    DEF.maxCp          = 2500.0;   % m/s   plausible upper bound for a P-wave speed
    DEF.minRho         = 0.5;      % g/cm3 plausible lower bound for density
    DEF.maxRho         = 3.0;      % g/cm3 plausible upper bound for density
    DEF.kmRangeWarn    = 2000.0;   % km    max range above this is suspected to be metres
    DEF.depthEqTol     = 1e-6;     % m     tolerance for "last SSP row == bottom depth"
    DEF.validSSP       = 'NCPSQHA';        % top-opt char 1 (read_env_core.m:61-79)
    DEF.validAtten     = 'NFMWQL';         % top-opt char 3 (read_env_core.m:83-98)
    DEF.validRunCalc   = 'REISCAa';        % run-type char 1 (read_bell.m:34-53)
    DEF.cervenyBeams   = 'CR';             % run-type char 2 that needs trailer lines

    % ---- resolve filename (append .env like read_env.m:13-15) ---------------
    envfile = char( envfile );
    [ ~, ~, ext ] = fileparts( envfile );
    if ( ~strcmp( ext, '.env' ) )
        envfile = [ envfile '.env' ];
    end

    fprintf( '\n=== validate_bellhop_env: %s ===\n', envfile );

    % ---- load every physical line, keep 1-based line numbers ----------------
    [ lineText, lineNo, loadErr ] = local_load_lines( envfile );
    if ( ~isempty( loadErr ) )
        % A missing/unreadable file is a hard, self-explanatory failure.
        fprintf( 2, 'FAIL: %s\n', loadErr );
        fprintf( '\nRESULT: FAIL (file could not be read)\n\n' );
        ok = false;
        return;
    end

    % Problem log: struct array with fields {sev,line,msg,hint}.
    P = struct( 'sev', {}, 'line', {}, 'msg', {}, 'hint', {} );

    % Cursor over data lines; k indexes into lineText/lineNo.
    k = 1;
    nLines = numel( lineText );

    % ------------------------------------------------------------------ TITLE
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    if ( raw < 0 )
        P = local_add( P, 'FAIL', NaN, 'File is empty or has no parseable title line.', ...
            'Line 1 must be a single-quoted title, e.g. ''My case''.' );
        ok = local_report( P );
        return;
    end
    if ( numel( strfind( ln, '''' ) ) < 2 )
        P = local_add( P, 'FAIL', raw, 'Title is not wrapped in a pair of single quotes.', ...
            'Wrap the title in single quotes, e.g. ''Munk profile, coherent''.' );
    end

    % ------------------------------------------------------------- FREQUENCY
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    freqVal = local_nums( ln );
    if ( raw < 0 || isempty( freqVal ) )
        P = local_add( P, 'FAIL', raw, 'Missing frequency line.', ...
            'Line 2 must be a single frequency in Hz, e.g. 50.0.' );
    elseif ( freqVal(1) <= 0 )
        P = local_add( P, 'FAIL', raw, sprintf( 'Frequency must be positive (got %g).', freqVal(1) ), ...
            'Set a positive frequency in Hz, e.g. 50.0.' );
    end

    % ---------------------------------------------------------------- NMEDIA
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    nmVal = local_nums( ln );
    if ( raw < 0 || isempty( nmVal ) )
        P = local_add( P, 'FAIL', raw, 'Missing NMEDIA line.', ...
            'Line 3 must be the integer number of media, normally 1 for BELLHOP.' );
        NMedia = 1;
    else
        NMedia = round( nmVal(1) );
        if ( NMedia < 1 )
            P = local_add( P, 'FAIL', raw, sprintf( 'NMEDIA must be >= 1 (got %d).', NMedia ), ...
                'Use 1 for a single water column; 2+ only for layered media.' );
            NMedia = 1;
        end
    end

    % ----------------------------------------------------------- TOP OPTIONS
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    topOpt = local_quoted( ln );
    topLine = raw;
    if ( isempty( topOpt ) )
        P = local_add( P, 'FAIL', raw, 'Top option string is not single-quoted.', ...
            'Wrap the top option in single quotes, e.g. ''SVW''.' );
        topOpt = '       ';
    else
        topOpt = local_pad( topOpt, 7 );
        if ( ~any( topOpt(1) == DEF.validSSP ) )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'Invalid SSP interpolation letter ''%s'' (top-opt char 1).', topOpt(1) ), ...
                sprintf( 'Use one of %s (N C P S Q H A).', DEF.validSSP ) );
        end
        if ( ~any( topOpt(3) == DEF.validAtten ) )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'Invalid attenuation-units letter ''%s'' (top-opt char 3).', topOpt(3) ), ...
                sprintf( 'Use one of %s; W (dB/wavelength) is the usual BELLHOP choice.', DEF.validAtten ) );
        end
    end

    % ----------------------------------- Top option conditional extra lines
    % 4a: Francois-Garrison T/S/pH/z_bar line iff top-opt char 4 == 'F'.
    if ( numel( topOpt ) >= 4 && topOpt(4) == 'F' )
        [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
        fg = local_nums( ln );
        if ( raw < 0 || numel( fg ) < 4 )
            P = local_add( P, 'FAIL', topLine, ...
                'Top-opt char 4 = F requires a Francois-Garrison line (T S pH z_bar) but it is missing or short.', ...
                'Add a line with 4 floats: temperature(C) salinity(psu) pH depth(m), e.g. 19.3 33.5 7.5 4000.7.' );
        end
    end
    % 4b: Top halfspace line iff top-opt char 2 == 'A' (rare).
    if ( numel( topOpt ) >= 2 && topOpt(2) == 'A' )
        [ k, ~, raw ] = local_next( lineText, lineNo, k, nLines );
        if ( raw < 0 )
            P = local_add( P, 'FAIL', topLine, ...
                'Top-opt char 2 = A requires a top halfspace line but it is missing.', ...
                'Add a halfspace line: z cp cs rho aI bI (with trailing /).' );
        end
    end

    % --------------------------------------------------------------- SSP block
    deepestSSP = -Inf;
    for medium = 1 : NMedia
        % "N sigma depth" header line.
        [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
        hdr = local_nums( ln );
        if ( raw < 0 || numel( hdr ) < 3 )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'Medium %d SSP header malformed (need N sigma depth).', medium ), ...
                'Provide three numbers: mesh-point-count sigma(m) bottomDepth(m), e.g. 51 0.0 5000.0.' );
            break;
        end
        declN     = round( hdr(1) );
        bottomDep = hdr(3);

        % SSP data rows: read until a row depth equals bottomDep (the true
        % terminator, read_env_core.m:191), tracking strict monotonicity.
        rowCount   = 0;
        prevZ      = -Inf;
        firstRow   = true;
        terminated = false;
        lastZ      = NaN;
        while ( k <= numel( lineText ) )
            [ kPeek, lnPeek, rawPeek ] = local_next( lineText, lineNo, k, nLines );
            vals = local_nums( lnPeek );
            if ( rawPeek < 0 || isempty( vals ) )
                break;   % no more numeric rows
            end
            % Heuristic stop: a 2-token line that looks like the bottom-opt
            % cannot occur (bottom opt is quoted), so any numeric row belongs
            % to the SSP until we hit the declared bottom depth.
            z = vals(1);
            k = kPeek;
            rowCount = rowCount + 1;
            lastZ = z;

            if ( ~firstRow && z <= prevZ )
                P = local_add( P, 'FAIL', rawPeek, ...
                    sprintf( 'Medium %d SSP depth not strictly increasing (%.4f after %.4f).', medium, z, prevZ ), ...
                    'SSP depths must strictly increase down the profile; remove or reorder the offending row.' );
            end
            % Trailing '/' is load-bearing on any row that omits sticky columns.
            % read_env_core.m does 6 unconditional fscanf('%f',1) per row; a row
            % with <6 numbers and no '/' reads the NEXT row's numbers into this
            % row's cs/rho/... and desyncs -> BELLHOP dies ("imaginary sound
            % speed > real part"). A full 6-column row needs no '/'.
            if ( ~contains( lnPeek, '/' ) && numel( vals ) < 6 )
                P = local_add( P, 'FAIL', rawPeek, ...
                    sprintf( 'Medium %d SSP row has %d columns and no trailing ''/''; the reader will desync into the next row.', medium, numel( vals ) ), ...
                    'Append ''  /'' to this SSP data row, e.g. 200.0 1530.29 /.' );
            end
            % Range of plausibility for the sound speed column.
            if ( numel( vals ) >= 2 && ( vals(2) < DEF.minCp || vals(2) > DEF.maxCp ) )
                P = local_add( P, 'WARN', rawPeek, ...
                    sprintf( 'Medium %d SSP sound speed %.2f m/s outside [%.0f, %.0f].', medium, vals(2), DEF.minCp, DEF.maxCp ), ...
                    'Check column 2 is a P-wave speed in m/s (water ~1450-1550).' );
            end
            prevZ    = z;
            firstRow = false;

            if ( abs( z - bottomDep ) <= DEF.depthEqTol )
                terminated = true;
                break;
            end
        end

        if ( ~terminated )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'Medium %d SSP never reaches the declared bottom depth %.4f m (last row %.4f m).', ...
                    medium, bottomDep, lastZ ), ...
                'The LAST SSP row depth must EQUAL the bottom depth on the header line, or BELLHOP overruns.' );
        end
        % N vs row count is informational only (N is mesh points, not rows).
        if ( declN > 0 && declN ~= rowCount )
            P = local_add( P, 'INFO', raw, ...
                sprintf( 'Medium %d declares N=%d mesh points but has %d SSP rows (this is normal; N != row count).', ...
                    medium, declN, rowCount ), '' );
        end
        deepestSSP = max( deepestSSP, bottomDep );
    end

    % ------------------------------------------------------- BOTTOM OPTION
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    botOpt = local_quoted( ln );
    if ( isempty( botOpt ) )
        P = local_add( P, 'FAIL', raw, 'Bottom option string is not single-quoted.', ...
            'Wrap the bottom option in single quotes, e.g. ''A'' followed by sigma, e.g. ''A'' 0.0.' );
        botOpt = '   ';
    else
        botOpt = local_pad( botOpt, 3 );
    end
    % Bottom halfspace line iff bottom-opt char 1 == 'A'.
    if ( ~any( botOpt(1) == 'VARFWP' ) )
        P = local_add( P, 'WARN', raw, ...
            sprintf( 'Bottom-opt char 1 = ''%c'' is not supported by the AT MATLAB readers (topbot.m accepts V A R F W P). ''G'' grain-size works in the compiled binary only.', botOpt(1) ), ...
            'For a G (grain-size) bottom, call the binary directly; the validator cannot track its extra data line.' );
    end
    if ( botOpt(1) == 'A' )
        [ k, lnHS, rawHS ] = local_next( lineText, lineNo, k, nLines );
        hs = local_nums( lnHS );
        if ( rawHS < 0 || numel( hs ) < 2 )
            P = local_add( P, 'FAIL', raw, ...
                'Bottom-opt = A requires an acousto-elastic halfspace line but it is missing or short.', ...
                'Add: z cp cs rho aI bI, e.g. 5000.0 1600.0 0.0 1.8 0.8 /.' );
        else
            if ( ~contains( lnHS, '/' ) && numel( hs ) < 6 )
                P = local_add( P, 'FAIL', rawHS, ...
                    sprintf( 'Halfspace line has %d columns and no trailing ''/''; the reader will desync into the source/receiver blocks.', numel( hs ) ), ...
                    'Append ''  /'' to the halfspace line, e.g. 5000.0 1600.0 0.0 1.8 0.8 /.' );
            end
            if ( numel( hs ) >= 4 && ( hs(4) < DEF.minRho || hs(4) > DEF.maxRho ) )
                P = local_add( P, 'WARN', rawHS, ...
                    sprintf( 'Halfspace density %.3f g/cm3 outside [%.1f, %.1f]; columns may be swapped.', hs(4), DEF.minRho, DEF.maxRho ), ...
                    'Order is z(m) cp(m/s) cs(m/s) rho(g/cm3) aI bI; cp/cs ~1500-2000, rho ~1-2.' );
            end
        end
    end

    % --------------------------------------- SOURCE / RECEIVER / RANGE blocks
    [ k, P, ~ ]        = local_vector( lineText, lineNo, k, nLines, P, 'NSD (source depths)', false );
    [ k, P, maxRz ]    = local_vector( lineText, lineNo, k, nLines, P, 'NRD (receiver depths)', false );
    [ k, P, maxRange ] = local_vector( lineText, lineNo, k, nLines, P, 'NR (receiver ranges, km)', true );

    if ( ~isnan( maxRange ) && maxRange > DEF.kmRangeWarn )
        P = local_add( P, 'WARN', NaN, ...
            sprintf( 'Max receiver range %.1f looks large for km; range block may be in metres.', maxRange ), ...
            'Receiver ranges are in KILOMETRES (readr.m); 100 km is written as 100.0, not 100000.' );
    end

    % ------------------------------------------------------------- RUN TYPE
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    runType = local_quoted( ln );
    if ( isempty( runType ) )
        P = local_add( P, 'FAIL', raw, 'Run-type string is not single-quoted.', ...
            'Wrap the run type in single quotes, e.g. ''CG'' or ''R''.' );
        runType = '     ';
    else
        runType = local_pad( runType, 5 );
        if ( ~any( runType(1) == DEF.validRunCalc ) )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'Invalid run-type calculation letter ''%s'' (char 1).', runType(1) ), ...
                'Use R(ay) E(igenray) I(ncoherent) S(emicoh) C(oherent) A/a(rrivals).' );
        end
    end

    % NBEAMS
    nBeams = NaN;
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    nbVals = local_nums( ln );
    if ( raw < 0 || isempty( nbVals ) )
        P = local_add( P, 'FAIL', raw, 'Missing NBEAMS line.', ...
            'Provide an integer beam count (0 = auto-estimate).' );
    else
        nBeams = nbVals(1);
    end

    % Launch-angle fan (a1 a2 /).
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    angVals = local_nums( ln );
    if ( raw < 0 || isempty( angVals ) )
        P = local_add( P, 'FAIL', raw, 'Missing launch-angle fan line.', ...
            'Provide ALPHA1 ALPHA2 / in degrees, e.g. -20.3 20.3 /.' );
    elseif ( ~contains( ln, '/' ) && ~( ~isnan( nBeams ) && nBeams > 0 && numel( angVals ) == nBeams ) )
        P = local_add( P, 'FAIL', raw, ...
            sprintf( 'Launch-angle line has no trailing ''/'' and does not supply exactly NBEAMS=%g explicit angles; the reader will read past it and desync.', nBeams ), ...
            'Use the canonical a1 a2 / form (e.g. -20.3 20.3 /), or list exactly NBEAMS angles when NBEAMS>0.' );
    end

    % STEP ZBOX RBOX line.
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    box = local_nums( ln );
    if ( raw < 0 || numel( box ) < 3 )
        P = local_add( P, 'FAIL', raw, 'Missing or short STEP/ZBOX/RBOX line.', ...
            'Provide three numbers: deltas(m) ZBOX(m) RBOX(km), e.g. 50.0 5500.0 101.0.' );
    else
        zbox = box(2);
        rbox = box(3);
        zRef = max( deepestSSP, local_nan2neg( maxRz ) );
        if ( isfinite( zRef ) && zbox <= zRef )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'ZBOX (%.2f m) does not exceed deepest receiver/SSP depth (%.2f m).', zbox, zRef ), ...
                'Set ZBOX a few percent above the deepest depth, else rays are clipped.' );
        end
        if ( ~isnan( maxRange ) && rbox <= maxRange )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'RBOX (%.2f km) does not exceed max receiver range (%.2f km).', rbox, maxRange ), ...
                'Set RBOX a few percent above the max receiver range, else rays are clipped.' );
        end
    end

    % --------------------------------------- Cerveny trailer consistency
    needsCerveny = ( numel( runType ) >= 2 && any( runType(2) == DEF.cervenyBeams ) );
    [ ~, ~, rawTrail ] = local_next( lineText, lineNo, k, nLines );
    haveTrailer = ( rawTrail > 0 );
    if ( needsCerveny && ~haveTrailer )
        P = local_add( P, 'FAIL', raw, ...
            sprintf( 'Run-type beam char ''%s'' (Cerveny) requires two trailing beam lines that are missing.', runType(2) ), ...
            'Add: ''<Type>'' epmult rLoop  then  Nimage Ibwin ''flag'' (see read_bell.m).' );
    elseif ( ~needsCerveny && haveTrailer )
        P = local_add( P, 'WARN', rawTrail, ...
            'Extra lines follow STEP/ZBOX/RBOX but the run type is not Cerveny; they will de-sync the parser.', ...
            'Remove trailing lines for geometric/Gaussian beams (run-type char 2 in G/B/S).' );
    end

    ok = local_report( P );
end

% ========================================================================
% Local helper functions
% ========================================================================

function [ lineText, lineNo, errMsg ] = local_load_lines( envfile )
% LOCAL_LOAD_LINES  Load all non-blank, non-pure-comment lines with line nums.
%   Returns cell array of trimmed line strings, parallel vector of original
%   1-based file line numbers, and an error message (empty on success).
    lineText = {};
    lineNo   = [];
    errMsg   = '';
    fid = fopen( envfile, 'r' );
    if ( fid == -1 )
        errMsg = sprintf( 'Unable to open environmental file: %s', envfile );
        return;
    end
    n = 0;
    raw = fgetl( fid );
    while ( ischar( raw ) )
        n = n + 1;
        s = strtrim( raw );
        % Keep the line if it has content before any '!' comment.
        code = strtrim( regexprep( s, '!.*$', '' ) );
        if ( ~isempty( code ) )
            lineText{ end + 1 } = code; %#ok<AGROW>
            lineNo( end + 1 )   = n;     %#ok<AGROW>
        end
        raw = fgetl( fid );
    end
    fclose( fid );
end

function [ kOut, lineStr, rawNo ] = local_next( lineText, lineNo, k, nLines )
% LOCAL_NEXT  Return the next data line and advance the cursor.
%   rawNo < 0 signals "no more lines" (caller checks this sentinel).
    if ( k > nLines )
        kOut    = k;
        lineStr = '';
        rawNo   = -1;
        return;
    end
    lineStr = lineText{ k };
    rawNo   = lineNo( k );
    kOut    = k + 1;
end

function v = local_nums( s )
% LOCAL_NUMS  Extract all leading floats from a line (Fortran fscanf style).
    if ( isempty( s ) )
        v = [];
        return;
    end
    v = sscanf( s, '%f' )';
end

function q = local_quoted( s )
% LOCAL_QUOTED  Return text between the first pair of single quotes, or ''.
    q = '';
    if ( isempty( s ) )
        return;
    end
    idx = strfind( s, '''' );
    if ( numel( idx ) >= 2 )
        q = s( idx(1) + 1 : idx(2) - 1 );
    end
end

function out = local_pad( s, width )
% LOCAL_PAD  Right-pad an option string with blanks to a fixed width.
    if ( numel( s ) >= width )
        out = s;
    else
        out = [ s, blanks( width - numel( s ) ) ];
    end
end

function P = local_add( P, sev, lineN, msg, hint )
% LOCAL_ADD  Append a problem record (severity, line, message, fix hint).
    P( end + 1 ) = struct( 'sev', sev, 'line', lineN, 'msg', msg, 'hint', hint );
end

function [ kOut, P, maxVal ] = local_vector( lineText, lineNo, k, nLines, P, label, isRange )
% LOCAL_VECTOR  Validate a count-line + value-line pair (readvector.m rules).
%   Verifies the declared count against the value row, honouring the '/'
%   linspace shorthand. Returns the max generated value for box checks.
    maxVal = NaN;
    [ k, lnCnt, rawCnt ] = local_next( lineText, lineNo, k, nLines );
    cnt = local_nums( lnCnt );
    if ( rawCnt < 0 || isempty( cnt ) )
        P = local_add( P, 'FAIL', rawCnt, sprintf( 'Missing count line for %s.', label ), ...
            'Provide an integer count, then the value row below it.' );
        kOut = k;
        return;
    end
    N = round( cnt(1) );
    if ( N < 1 )
        P = local_add( P, 'FAIL', rawCnt, sprintf( '%s count must be >= 1 (got %d).', label, N ), ...
            'Use a positive count; with ''/'' BELLHOP fabricates N evenly spaced values.' );
    end

    [ kOut, lnVal, rawVal ] = local_next( lineText, lineNo, k, nLines );
    vals = local_nums( lnVal );
    if ( rawVal < 0 || isempty( vals ) )
        P = local_add( P, 'FAIL', rawVal, sprintf( 'Missing value row for %s.', label ), ...
            'Provide the values (or two endpoints with ''/'') on the line after the count.' );
        return;
    end

    hasSlash = contains( lnVal, '/' );
    if ( hasSlash )
        % '/' form: only the first two values are read; linspace if N>2.
        if ( numel( vals ) > 2 )
            P = local_add( P, 'WARN', rawVal, ...
                sprintf( '%s value row has %d numbers before ''/''; only the first two are used.', label, numel( vals ) ), ...
                'With ''/'' provide exactly two endpoints (or one to replicate), e.g. 0.0 5000.0 /.' );
        end
        if ( N > 2 && numel( vals ) >= 2 )
            maxVal = max( vals(1), vals(2) );
        else
            maxVal = max( vals );
        end
    else
        % No '/': exactly N explicit values are required.
        if ( numel( vals ) ~= N )
            P = local_add( P, 'FAIL', rawVal, ...
                sprintf( '%s declares N=%d but value row (no ''/'') has %d numbers; parser will de-sync.', label, N, numel( vals ) ), ...
                'Either list exactly N values, or use two endpoints with a trailing ''/''.' );
        end
        maxVal = max( vals );
    end

    if ( isRange && N >= 2 && hasSlash && numel( vals ) >= 2 && vals(1) > vals(2) )
        P = local_add( P, 'WARN', rawVal, ...
            sprintf( '%s endpoints decrease (%.3f then %.3f).', label, vals(1), vals(2) ), ...
            'List ranges in increasing order, e.g. 0.0 100.0 /.' );
    end
end

function y = local_nan2neg( x )
% LOCAL_NAN2NEG  Map NaN to -Inf so max() ignores absent receiver depths.
    if ( isnan( x ) )
        y = -Inf;
    else
        y = x;
    end
end

function ok = local_report( P )
% LOCAL_REPORT  Print all problems grouped by severity, then a PASS/FAIL line.
    nFail = sum( strcmp( { P.sev }, 'FAIL' ) );
    nWarn = sum( strcmp( { P.sev }, 'WARN' ) );
    nInfo = sum( strcmp( { P.sev }, 'INFO' ) );

    for ii = 1 : numel( P )
        if ( isnan( P(ii).line ) )
            loc = '(file)';
        else
            loc = sprintf( 'line %d', P(ii).line );
        end
        msg = sprintf( '%-4s %-9s %s', P(ii).sev, loc, P(ii).msg );
        if ( strcmp( P(ii).sev, 'FAIL' ) )
            fprintf( 2, '%s\n', msg );
        else
            fprintf( '%s\n', msg );
        end
        if ( ~isempty( P(ii).hint ) )
            fprintf( '          fix: %s\n', P(ii).hint );
        end
    end

    fprintf( '\n----------------------------------------------------------\n' );
    fprintf( 'Summary: %d FAIL, %d WARN, %d INFO\n', nFail, nWarn, nInfo );
    if ( nFail == 0 )
        fprintf( 'RESULT: PASS (safe to run BELLHOP)\n\n' );
        ok = true;
    else
        fprintf( 'RESULT: FAIL (fix the items above before running BELLHOP)\n\n' );
        ok = false;
    end
end

