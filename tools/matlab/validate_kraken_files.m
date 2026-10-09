function ok = validate_kraken_files( casename )
% VALIDATE_KRAKEN_FILES  Line-level sanity checker for a KRAKEN case (.env + .flp).
%
%   ok = validate_kraken_files( casename )
%
% PURPOSE
%   KRAKEN (and KRAKENC/KRAKEL) is driven by TWO files: a casename.env read by
%   read_env.m -> read_env_core.m, and a separate casename.flp read by the field
%   program via read_flp.m. The Acoustics Toolbox (AT) readers parse both with
%   Fortran free-format fscanf and give NO line numbers; when a file is malformed
%   they either error deep in the stack or, worse, silently de-sync and produce a
%   corrupt run. This validator front-runs KRAKEN and reports EVERY problem it
%   finds with the offending file + line number and a concrete fix hint, so an AI
%   agent or a user cannot easily launch a malformed run.
%
%   It deliberately re-implements line-tracking parsers (the raw AT readers give
%   no line numbers) but follows the exact same parsing rules so the diagnostics
%   match what KRAKEN/field will actually do.
%
% INPUT
%   casename : char row vector or string scalar.
%              The case name WITHOUT extension. A stray ".env"/".flp" is stripped.
%              Both casename.env AND casename.flp are validated.
%
% OUTPUT
%   ok       : logical scalar.
%              true  -> no FAIL-level problems in either file (WARN may print).
%              false -> at least one FAIL-level problem; do NOT run KRAKEN.
%
% ENV CHECKS (FAIL unless noted)  -- KRAKEN .env layout vs BELLHOP:
%   - Title / top-opt / bottom-opt are single-quoted; frequency > 0; NMEDIA >= 1.
%   - Valid SSP interpolation letter (top-opt char 1) and attenuation-units
%     letter (top-opt char 3).
%   - Conditional lines present/absent consistently: Francois-Garrison line iff
%     top-opt char 4 == 'F'; top halfspace iff top-opt char 2 == 'A'; bottom
%     halfspace line iff bottom-opt char 1 == 'A'.
%   - SSP depths strictly increasing; the LAST SSP row depth of each medium must
%     EQUAL that medium's bottom depth on the "N sigma depth" header
%     (read_env_core.m:191). Declared N is mesh points, not a row count (INFO).
%   - KRAKEN-only cLow/cHigh line: two floats in m/s, cLow < cHigh, both
%     plausible phase speeds (read_env.m:22-23).
%   - KRAKEN-only RMax line: one float in km (read_env.m:27).
%   - NSz/NRz declared counts vs their value rows ("count==rows"), honouring the
%     '/' linspace shorthand (readvector.m).
%
% FLP CHECKS (FAIL unless noted):
%   - Title line present (quoted, or '/' for the default-from-mode-file form).
%   - Option string single-quoted; coord letter (char 1) in {R,X}; field-type /
%     coupling letter (char 2) in {C,A,P,B,O}.
%   - MLimit (mode-count cap) is a positive integer.
%   - NProf/NRr/NSz/NRz declared counts match their value rows ("count==rows").
%   - Receiver range-offset (array-tilt) block, if present, is all zeros
%     (read_flp.m:87 errors otherwise; field does not implement tilt).
%
% CROSS-FILE CHECK
%   - If RMax (env, km) > 0 it must be >= the max receiver range in the .flp
%     (km). RMax == 0 is legal and common (field uses the .flp ranges).
%
% SEE ALSO
%   run_kraken, validate_bellhop_env, read_env, read_env_core, read_flp,
%   readvector, readszrz

    % ---- default tuning constants (documented, no bare magic numbers) -------
    DEF.minCp        = 1400.0;   % m/s   plausible lower bound for a sound speed
    DEF.maxCp        = 2500.0;   % m/s   plausible upper bound for a P-wave speed
    DEF.minRho       = 0.5;      % g/cm3 plausible lower bound for density
    DEF.maxRho       = 3.0;      % g/cm3 plausible upper bound for density
    DEF.cPhaseMin    = 100.0;    % m/s   plausible lower bound for a phase speed
    DEF.cPhaseMax    = 1.0e5;    % m/s   plausible upper bound (excludes 1e9 sentinel)
    DEF.cHighSentinel= 1.0e9;    % m/s   "keep all modes" sentinel for cHigh
    DEF.kmRangeWarn  = 2000.0;   % km    range above this is suspected to be metres
    DEF.depthEqTol   = 1e-6;     % m     tolerance for "last SSP row == bottom depth"
    DEF.validSSP     = 'NCPSQHA';        % top-opt char 1 (read_env_core.m:61-79)
    DEF.validAtten   = 'NFMWQL';         % top-opt char 3 (read_env_core.m:83-98)
    DEF.validBotBC   = 'VARFWP';         % bottom-opt char 1 (topbot.m)
    DEF.validCoord   = 'RX';             % flp option char 1 (read_flp.m:25-30)
    DEF.validField   = 'CAPBO';          % flp option char 2 (coupled/adiab/assembly)

    % ---- resolve case name -> envfile/flpfile -------------------------------
    casename = char( casename );
    [ cp, cn, ce ] = fileparts( casename );
    if ( strcmpi( ce, '.env' ) || strcmpi( ce, '.flp' ) )
        casename = fullfile( cp, cn );
    end
    envfile = [ casename '.env' ];
    flpfile = [ casename '.flp' ];

    fprintf( '\n=== validate_kraken_files: %s (.env + .flp) ===\n', casename );

    % Problem log: struct array with fields {sev,file,line,msg,hint}.
    P = struct( 'sev', {}, 'file', {}, 'line', {}, 'msg', {}, 'hint', {} );

    % ---- validate the .env, returning RMax (km) for the cross-file check ----
    [ P, rmaxKm ] = local_check_env( envfile, P, DEF );

    % ---- validate the .flp, returning the max receiver range (km) -----------
    [ P, maxRrKm ] = local_check_flp( flpfile, P, DEF );

    % ---- cross-file: RMax (env) must cover the receiver ranges (flp) --------
    if ( ~isnan( rmaxKm ) && rmaxKm > 0 && ~isnan( maxRrKm ) && maxRrKm > rmaxKm )
        P = local_add( P, 'FAIL', '(cross)', NaN, ...
            sprintf( 'RMax in .env (%.3f km) is less than the max receiver range in .flp (%.3f km).', ...
                rmaxKm, maxRrKm ), ...
            'Raise RMax (env, km) to >= the largest .flp receiver range, or set RMax = 0 to use the .flp ranges.' );
    end

    ok = local_report( P );
end

% ========================================================================
% .env checker
% ========================================================================

function [ P, rmaxKm ] = local_check_env( envfile, P, DEF )
% LOCAL_CHECK_ENV  Validate the KRAKEN .env and return RMax in km (NaN if absent).
%   Layout per read_env.m: shared core block (title -> bottom halfspace,
%   identical to BELLHOP), then the two KRAKEN-only lines cLow/cHigh (m/s) and
%   RMax (km), then source + receiver depths (readszrz). There is NO receiver
%   range line, NO run-type, and NO beam block.
    rmaxKm = NaN;

    [ lineText, lineNo, loadErr ] = local_load_lines( envfile );
    if ( ~isempty( loadErr ) )
        P = local_add( P, 'FAIL', envfile, NaN, loadErr, ...
            'Create casename.env in the working directory (KRAKEN appends .env itself).' );
        return;
    end

    k      = 1;
    nLines = numel( lineText );
    fn     = envfile;

    % ------------------------------------------------------------------ TITLE
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    if ( raw < 0 )
        P = local_add( P, 'FAIL', fn, NaN, 'File is empty or has no parseable title line.', ...
            'Line 1 must be a single-quoted title, e.g. ''My KRAKEN case''.' );
        return;
    end
    if ( numel( strfind( ln, '''' ) ) < 2 )
        P = local_add( P, 'FAIL', fn, raw, 'Title is not wrapped in a pair of single quotes.', ...
            'Wrap the title in single quotes, e.g. ''Munk profile''.' );
    end

    % ------------------------------------------------------------- FREQUENCY
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    freqVal = local_nums( ln );
    if ( raw < 0 || isempty( freqVal ) )
        P = local_add( P, 'FAIL', fn, raw, 'Missing frequency line.', ...
            'Line 2 must be a single frequency in Hz, e.g. 50.0.' );
    elseif ( freqVal(1) <= 0 )
        P = local_add( P, 'FAIL', fn, raw, sprintf( 'Frequency must be positive (got %g).', freqVal(1) ), ...
            'Set a positive frequency in Hz, e.g. 50.0.' );
    end

    % ---------------------------------------------------------------- NMEDIA
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    nmVal = local_nums( ln );
    if ( raw < 0 || isempty( nmVal ) )
        P = local_add( P, 'FAIL', fn, raw, 'Missing NMEDIA line.', ...
            'Line 3 must be the integer number of media (water column = 1, +1 per sediment layer).' );
        NMedia = 1;
    else
        NMedia = round( nmVal(1) );
        if ( NMedia < 1 )
            P = local_add( P, 'FAIL', fn, raw, sprintf( 'NMEDIA must be >= 1 (got %d).', NMedia ), ...
                'KRAKEN routinely uses >1 (water + sediment); use a positive integer.' );
            NMedia = 1;
        end
    end

    % ----------------------------------------------------------- TOP OPTIONS
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    topOpt  = local_quoted( ln );
    topLine = raw;
    if ( isempty( topOpt ) )
        P = local_add( P, 'FAIL', fn, raw, 'Top option string is not single-quoted.', ...
            'Wrap the top option in single quotes, e.g. ''NVW'' (N2-linear, vacuum top, dB/wavelength).' );
        topOpt = '       ';
    else
        topOpt = local_pad( topOpt, 7 );
        if ( ~any( topOpt(1) == DEF.validSSP ) )
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'Invalid SSP interpolation letter ''%s'' (top-opt char 1).', topOpt(1) ), ...
                sprintf( 'Use one of %s (N C P S Q H A); real KRAKEN files use N.', DEF.validSSP ) );
        end
        if ( ~any( topOpt(3) == DEF.validAtten ) )
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'Invalid attenuation-units letter ''%s'' (top-opt char 3).', topOpt(3) ), ...
                sprintf( 'Use one of %s; W (dB/wavelength) is the usual KRAKEN choice.', DEF.validAtten ) );
        end
    end

    % ----------------------------------- Top option conditional extra lines
    % 4a: Francois-Garrison T/S/pH/z_bar line iff top-opt char 4 == 'F'.
    if ( numel( topOpt ) >= 4 && topOpt(4) == 'F' )
        [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
        fg = local_nums( ln );
        if ( raw < 0 || numel( fg ) < 4 )
            P = local_add( P, 'FAIL', fn, topLine, ...
                'Top-opt char 4 = F requires a Francois-Garrison line (T S pH z_bar) but it is missing or short.', ...
                'Add a line with 4 floats: temperature(C) salinity(psu) pH depth(m).' );
        end
    end
    % 4b: Top halfspace line iff top-opt char 2 == 'A' (rare).
    if ( numel( topOpt ) >= 2 && topOpt(2) == 'A' )
        [ k, ~, raw ] = local_next( lineText, lineNo, k, nLines );
        if ( raw < 0 )
            P = local_add( P, 'FAIL', fn, topLine, ...
                'Top-opt char 2 = A requires a top halfspace line but it is missing.', ...
                'Add a halfspace line: z cp cs rho aI bI (with trailing /).' );
        end
    end

    % --------------------------------------------------------------- SSP block
    % One block per medium: header "N sigma depth" then data rows until a row
    % depth equals the medium bottom depth (read_env_core.m:191).
    deepestSSP = -Inf;
    for medium = 1 : NMedia
        [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
        hdr = local_nums( ln );
        if ( raw < 0 || numel( hdr ) < 3 )
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'Medium %d SSP header malformed (need N sigma depth).', medium ), ...
                'Provide three numbers: mesh-point-count sigma(m) bottomDepth(m), e.g. 0 0.0 5000.0.' );
            break;
        end
        declN     = round( hdr(1) );
        bottomDep = hdr(3);

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
            z = vals(1);
            k = kPeek;
            rowCount = rowCount + 1;
            lastZ = z;

            if ( ~firstRow && z <= prevZ )
                P = local_add( P, 'FAIL', fn, rawPeek, ...
                    sprintf( 'Medium %d SSP depth not strictly increasing (%.4f after %.4f).', medium, z, prevZ ), ...
                    'SSP depths must strictly increase down the profile; remove or reorder the offending row.' );
            end
            % Trailing '/' lets omitted sticky columns default (read_env_core.m:160-166).
            if ( ~contains( lnPeek, '/' ) )
                P = local_add( P, 'WARN', fn, rawPeek, ...
                    sprintf( 'Medium %d SSP row has no trailing ''/'' (sticky-column rows need it).', medium ), ...
                    'Append ''  /'' to each SSP data row, e.g. 200.0 1530.29 /.' );
            end
            if ( numel( vals ) >= 2 && ( vals(2) < DEF.minCp || vals(2) > DEF.maxCp ) )
                P = local_add( P, 'WARN', fn, rawPeek, ...
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
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'Medium %d SSP never reaches the declared bottom depth %.4f m (last row %.4f m).', ...
                    medium, bottomDep, lastZ ), ...
                'The LAST SSP row depth must EQUAL the bottom depth on the header line, or the reader overruns.' );
        end
        if ( declN > 0 && declN ~= rowCount )
            P = local_add( P, 'INFO', fn, raw, ...
                sprintf( 'Medium %d declares N=%d mesh points but has %d SSP rows (this is normal; N != row count).', ...
                    medium, declN, rowCount ), '' );
        end
        deepestSSP = max( deepestSSP, bottomDep );
    end

    % ------------------------------------------------------- BOTTOM OPTION
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    botOpt = local_quoted( ln );
    if ( isempty( botOpt ) )
        P = local_add( P, 'FAIL', fn, raw, 'Bottom option string is not single-quoted.', ...
            'Wrap the bottom option in single quotes, e.g. ''A'' 0.0 (acousto-elastic halfspace, sigma).' );
        botOpt = '   ';
    else
        botOpt = local_pad( botOpt, 3 );
    end
    if ( ~any( botOpt(1) == DEF.validBotBC ) )
        P = local_add( P, 'WARN', fn, raw, ...
            sprintf( 'Bottom-opt char 1 = ''%c'' is not in the AT MATLAB reader set (topbot.m accepts %s).', botOpt(1), DEF.validBotBC ), ...
            'Use V (vacuum) A (acousto-elastic halfspace) R (rigid) F (reflection-coef file) W (write IRC) or P (read IRC).' );
    end
    % Bottom halfspace line iff bottom-opt char 1 == 'A'.
    if ( botOpt(1) == 'A' )
        [ k, lnHS, rawHS ] = local_next( lineText, lineNo, k, nLines );
        hs = local_nums( lnHS );
        if ( rawHS < 0 || numel( hs ) < 2 )
            P = local_add( P, 'FAIL', fn, raw, ...
                'Bottom-opt = A requires an acousto-elastic halfspace line but it is missing or short.', ...
                'Add: z cp cs rho aI bI, e.g. 5000.0 1600.0 0.0 1.8 0.8 /.' );
        else
            if ( isfinite( deepestSSP ) && abs( hs(1) - deepestSSP ) > DEF.depthEqTol )
                P = local_add( P, 'WARN', fn, rawHS, ...
                    sprintf( 'Halfspace top depth %.3f m differs from the deepest SSP depth %.3f m.', hs(1), deepestSSP ), ...
                    'The halfspace top depth should equal the deepest SSP depth.' );
            end
            if ( numel( hs ) >= 4 && ( hs(4) < DEF.minRho || hs(4) > DEF.maxRho ) )
                P = local_add( P, 'WARN', fn, rawHS, ...
                    sprintf( 'Halfspace density %.3f g/cm3 outside [%.1f, %.1f]; columns may be swapped.', hs(4), DEF.minRho, DEF.maxRho ), ...
                    'Order is z(m) cp(m/s) cs(m/s) rho(g/cm3) aI bI; cp/cs ~1500-2000, rho ~1-2.' );
            end
        end
    end

    % ----------------------------------- KRAKEN-only: cLow cHigh (m/s)
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    cInt = local_nums( ln );
    if ( raw < 0 || numel( cInt ) < 2 )
        P = local_add( P, 'FAIL', fn, raw, ...
            'Missing or short cLow/cHigh line (KRAKEN-only phase-speed window, m/s).', ...
            'Add a line with two floats: cLow cHigh in m/s, e.g. 1500 1600. Omitting it desyncs readszrz.' );
    else
        cLow  = cInt(1);
        cHigh = cInt(2);
        if ( cLow >= cHigh )
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'cLow (%.1f) must be < cHigh (%.1f) m/s.', cLow, cHigh ), ...
                'Set cLow below the slowest water speed and cHigh at/above the bottom speed.' );
        end
        if ( cLow ~= 0.0 && ( cLow < DEF.cPhaseMin || cLow > DEF.cPhaseMax ) )
            P = local_add( P, 'WARN', fn, raw, ...
                sprintf( 'cLow %.1f m/s is outside the plausible phase-speed range [%.0f, %.0f].', cLow, DEF.cPhaseMin, DEF.cPhaseMax ), ...
                'cLow/cHigh are phase speeds in m/s (NOT km); set cLow just below the slowest sound speed.' );
        end
        if ( cHigh ~= DEF.cHighSentinel && ( cHigh < DEF.cPhaseMin || cHigh > DEF.cPhaseMax ) )
            P = local_add( P, 'WARN', fn, raw, ...
                sprintf( 'cHigh %.1f m/s is outside the plausible phase-speed range [%.0f, %.0f].', cHigh, DEF.cPhaseMin, DEF.cPhaseMax ), ...
                sprintf( 'cHigh is in m/s; use the bottom speed (or %g to keep all modes).', DEF.cHighSentinel ) );
        end
    end

    % ----------------------------------- KRAKEN-only: RMax (km)
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    rm = local_nums( ln );
    if ( raw < 0 || isempty( rm ) )
        P = local_add( P, 'FAIL', fn, raw, ...
            'Missing RMax line (KRAKEN-only max range, km).', ...
            'Add a single float: RMax in km. 0 is legal and common (field uses the .flp ranges).' );
    else
        rmaxKm = rm(1);
        if ( rmaxKm < 0 )
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'RMax must be >= 0 (got %g km).', rmaxKm ), ...
                'Use 0 to defer to the .flp ranges, or a positive max range in km.' );
        elseif ( rmaxKm > DEF.kmRangeWarn )
            P = local_add( P, 'WARN', fn, raw, ...
                sprintf( 'RMax %.1f looks large for km; this line is in KILOMETRES.', rmaxKm ), ...
                'RMax is in km; 30 km is written 30.0, not 30000.' );
        end
    end

    % --------------------------------------- SOURCE / RECEIVER depth blocks
    % KRAKEN reads only source + receiver DEPTHS here (readszrz); ranges live
    % in the .flp. No run-type, no beam block follow.
    [ k, P, ~ ] = local_vector( lineText, lineNo, k, nLines, P, fn, 'NSz (source depths, m)', false );
    [ ~, P, ~ ] = local_vector( lineText, lineNo, k, nLines, P, fn, 'NRz (receiver depths, m)', false );
end

% ========================================================================
% .flp checker
% ========================================================================

function [ P, maxRrKm ] = local_check_flp( flpfile, P, DEF )
% LOCAL_CHECK_FLP  Validate the field .flp and return the max receiver range (km).
%   Layout per read_flp.m: title, option, MLimit, profile ranges (km),
%   receiver ranges (km), source depths (m), receiver depths (m), then the
%   receiver range-displacement (array-tilt) block which must be all zeros.
    maxRrKm = NaN;

    [ lineText, lineNo, loadErr ] = local_load_lines( flpfile );
    if ( ~isempty( loadErr ) )
        P = local_add( P, 'FAIL', flpfile, NaN, loadErr, ...
            'Create casename.flp in the working directory (field reads the field-parameters file).' );
        return;
    end

    k      = 1;
    nLines = numel( lineText );
    fn     = flpfile;

    % --------------------------------------------------------------- TITLE
    % read_flp.m:16-22 accepts a quoted title, or a bare '/' for "take the
    % title from the mode file". Either is fine; only flag a totally empty line.
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    if ( raw < 0 )
        P = local_add( P, 'FAIL', fn, NaN, 'File is empty or has no title line.', ...
            'Line 1 is the title: a single-quoted string, or ''/'' to reuse the mode-file title.' );
        return;
    end
    if ( numel( strfind( ln, '''' ) ) < 2 && ~contains( ln, '/' ) )
        P = local_add( P, 'WARN', fn, raw, ...
            'Title is neither single-quoted nor a ''/'' default marker.', ...
            'Use a quoted title, e.g. ''Coupled modes'', or ''/'' to reuse the mode-file title.' );
    end

    % --------------------------------------------------------------- OPTION
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    opt = local_quoted( ln );
    if ( isempty( opt ) )
        P = local_add( P, 'FAIL', fn, raw, 'Option string is not single-quoted.', ...
            'Wrap the option in single quotes, e.g. ''RA'' (cylindrical, adiabatic) or ''RC'' (coupled).' );
    else
        opt = local_pad( opt, 3 );
        if ( ~any( opt(1) == DEF.validCoord ) )
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'Invalid coordinate letter ''%s'' (option char 1).', opt(1) ), ...
                'Use R (cylindrical, normal) or X (Cartesian).' );
        end
        if ( ~any( opt(2) == DEF.validField ) )
            P = local_add( P, 'FAIL', fn, raw, ...
                sprintf( 'Invalid field-type/coupling letter ''%s'' (option char 2).', opt(2) ), ...
                'Use A (adiabatic) or C (coupled); P/B/O select coherent/incoherent assembly in some builds.' );
        end
    end

    % --------------------------------------------------------------- MLimit
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    ml = local_nums( ln );
    if ( raw < 0 || isempty( ml ) )
        P = local_add( P, 'FAIL', fn, raw, 'Missing MLimit line (max number of modes to include).', ...
            'Provide an integer mode cap; use a big sentinel like 9999 to keep all modes.' );
    elseif ( round( ml(1) ) < 1 )
        P = local_add( P, 'FAIL', fn, raw, sprintf( 'MLimit must be >= 1 (got %d).', round( ml(1) ) ), ...
            'MLimit is an upper cap on modes; use 9999 to keep all.' );
    end

    % --------------------------------------------- PROFILE RANGES (km)
    [ k, P, nProf, ~ ] = local_vector_n( lineText, lineNo, k, nLines, P, fn, 'NProf (profile ranges, km)', true, DEF );
    if ( ~isnan( nProf ) && nProf > 1 )
        P = local_add( P, 'INFO', fn, NaN, ...
            sprintf( 'NProf = %d (range-dependent run): NProf must equal the number of mode sets (.mod) produced.', nProf ), '' );
    end

    % --------------------------------------------- RECEIVER RANGES (km)
    [ k, P, ~, maxRrKm ] = local_vector_n( lineText, lineNo, k, nLines, P, fn, 'NRr (receiver ranges, km)', true, DEF );

    % --------------------------------------------- SOURCE / RECEIVER DEPTHS (m)
    [ k, P, ~ ]    = local_vector( lineText, lineNo, k, nLines, P, fn, 'NSz (source depths, m)', false );
    [ k, P, nRz, ~ ] = local_vector_n( lineText, lineNo, k, nLines, P, fn, 'NRz (receiver depths, m)', false, [] );

    % --------------------------------------------- RANGE-OFFSET / ARRAY TILT (m)
    % read_flp.m:72-89: the modern reader reads this block and errors if any
    % value is nonzero (field does not implement tilt). Older .flp files omit it.
    % The Fortran field.exe additionally enforces NRro == NRz and aborts
    % otherwise; the MATLAB field.m does not, so this cross-check catches a bug
    % that would only surface when running the binary.
    [ kCnt, lnCnt, rawCnt ] = local_next( lineText, lineNo, k, nLines );
    if ( rawCnt > 0 && ~isempty( local_nums( lnCnt ) ) )
        nRo = local_nums( lnCnt );
        nRo = nRo(1);
        if ( ~isnan( nRz ) && nRo ~= nRz )
            P = local_add( P, 'FAIL', fn, rawCnt, ...
                sprintf( 'Range-offset count NRro=%d must equal NRz=%d; the Fortran field.exe aborts with "Number of range offsets ... not equal to number of depths".', nRo, nRz ), ...
                sprintf( 'Set the range-offset count to %d and use the replicate shorthand "0.0 /" (as shipped MunkK.flp / DickinsFlatK.flp do).', nRz ) );
        end
        [ ~, lnVal, rawVal ] = local_next( lineText, lineNo, kCnt, nLines );
        ro = local_nums( lnVal );
        if ( rawVal > 0 && ~isempty( ro ) && max( abs( ro ) ) > 0.0 )
            P = local_add( P, 'FAIL', fn, rawVal, ...
                'Receiver range-offset (array-tilt) values are nonzero; field.m does not implement tilt.', ...
                'Set all range offsets to 0.0 (read_flp.m:87 errors on any nonzero value).' );
        end
    end
end

% ========================================================================
% Local helper functions
% ========================================================================

function [ lineText, lineNo, errMsg ] = local_load_lines( fname )
% LOCAL_LOAD_LINES  Load all non-blank, non-pure-comment lines with line nums.
%   Returns cell array of trimmed code strings, parallel vector of original
%   1-based file line numbers, and an error message (empty on success).
    lineText = {};
    lineNo   = [];
    errMsg   = '';
    fid = fopen( fname, 'r' );
    if ( fid == -1 )
        errMsg = sprintf( 'Unable to open file: %s', fname );
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
%   Commas between values are tolerated (gulf_rd.env uses them).
    if ( isempty( s ) )
        v = [];
        return;
    end
    v = sscanf( strrep( s, ',', ' ' ), '%f' )';
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

function P = local_add( P, sev, file, lineN, msg, hint )
% LOCAL_ADD  Append a problem record (severity, file, line, message, fix hint).
    P( end + 1 ) = struct( 'sev', sev, 'file', file, 'line', lineN, 'msg', msg, 'hint', hint );
end

function [ kOut, P, maxVal ] = local_vector( lineText, lineNo, k, nLines, P, fn, label, isRange )
% LOCAL_VECTOR  Validate a count-line + value-line pair (readvector.m rules).
%   Verifies the declared count against the value row, honouring the '/'
%   linspace shorthand. Returns the max generated value.
    [ kOut, P, ~, maxVal ] = local_vector_n( lineText, lineNo, k, nLines, P, fn, label, isRange, [] );
end

function [ kOut, P, N, maxVal ] = local_vector_n( lineText, lineNo, k, nLines, P, fn, label, isRange, DEF )
% LOCAL_VECTOR_N  As local_vector, but also returns the declared count N.
%   Implements the "count==rows" rule: a count line, then either exactly N
%   explicit values, or "first last /" (linspace), or "value /" (replicate).
    N      = NaN;
    maxVal = NaN;
    [ k, lnCnt, rawCnt ] = local_next( lineText, lineNo, k, nLines );
    cnt = local_nums( lnCnt );
    if ( rawCnt < 0 || isempty( cnt ) )
        P = local_add( P, 'FAIL', fn, rawCnt, sprintf( 'Missing count line for %s.', label ), ...
            'Provide an integer count, then the value row below it.' );
        kOut = k;
        return;
    end
    N = round( cnt(1) );
    if ( N < 1 )
        P = local_add( P, 'FAIL', fn, rawCnt, sprintf( '%s count must be >= 1 (got %d).', label, N ), ...
            'Use a positive count; with ''/'' the reader fabricates N evenly spaced values.' );
    end

    [ kOut, lnVal, rawVal ] = local_next( lineText, lineNo, k, nLines );
    vals = local_nums( lnVal );
    if ( rawVal < 0 || isempty( vals ) )
        P = local_add( P, 'FAIL', fn, rawVal, sprintf( 'Missing value row for %s.', label ), ...
            'Provide the values (or two endpoints with ''/'') on the line after the count.' );
        return;
    end

    hasSlash = contains( lnVal, '/' );
    if ( hasSlash )
        % '/' form: only the first two values are read; linspace if N>2.
        if ( numel( vals ) > 2 )
            P = local_add( P, 'WARN', fn, rawVal, ...
                sprintf( '%s value row has %d numbers before ''/''; only the first two are used.', label, numel( vals ) ), ...
                'With ''/'' provide exactly two endpoints (or one to replicate), e.g. 0.0 5000.0 /.' );
        end
        if ( N > 2 && numel( vals ) >= 2 )
            maxVal = max( vals(1), vals(2) );
        else
            maxVal = max( vals );
        end
    else
        % No '/': the reader (readvector.m) does sscanf(tline,'%f',N) — it reads
        % the FIRST N values from this one line and ignores extras, and every
        % count/value pair is its own fgetl, so over-supply does NOT de-sync.
        % Only UNDER-supply (fewer than N numbers on the line) is a real problem.
        if ( numel( vals ) < N )
            P = local_add( P, 'FAIL', fn, rawVal, ...
                sprintf( '%s declares N=%d but value row (no ''/'') has only %d numbers; the reader cannot fill N values.', label, N, numel( vals ) ), ...
                'List exactly N values, or use two endpoints with a trailing ''/''.' );
        elseif ( numel( vals ) > N )
            P = local_add( P, 'INFO', fn, rawVal, ...
                sprintf( '%s declares N=%d but value row has %d numbers; the reader uses the first %d and ignores the rest.', label, N, numel( vals ), N ), ...
                'Harmless (this matches shipped files like gulf_ri.flp), but trimming to N is tidier.' );
        end
        maxVal = max( vals );
    end

    if ( isRange && N >= 2 && hasSlash && numel( vals ) >= 2 && vals(1) > vals(2) )
        P = local_add( P, 'WARN', fn, rawVal, ...
            sprintf( '%s endpoints decrease (%.3f then %.3f).', label, vals(1), vals(2) ), ...
            'List ranges in increasing order, e.g. 0.0 100.0 /.' );
    end

    % Heuristic: ranges declared in km should not look like metres.
    if ( isRange && ~isempty( DEF ) && isstruct( DEF ) && ~isnan( maxVal ) && maxVal > DEF.kmRangeWarn )
        P = local_add( P, 'WARN', fn, rawVal, ...
            sprintf( '%s max value %.1f looks large for km; this block is in KILOMETRES.', label, maxVal ), ...
            'Profile/receiver ranges are in km; 100 km is written 100.0, not 100000.' );
    end
end

function ok = local_report( P )
% LOCAL_REPORT  Print all problems grouped by file/severity, then PASS/FAIL.
    nFail = sum( strcmp( { P.sev }, 'FAIL' ) );
    nWarn = sum( strcmp( { P.sev }, 'WARN' ) );
    nInfo = sum( strcmp( { P.sev }, 'INFO' ) );

    for ii = 1 : numel( P )
        if ( isnan( P(ii).line ) )
            loc = sprintf( '%s (file)', P(ii).file );
        else
            loc = sprintf( '%s:%d', P(ii).file, P(ii).line );
        end
        msg = sprintf( '%-4s %-28s %s', P(ii).sev, loc, P(ii).msg );
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
        fprintf( 'RESULT: PASS (safe to run KRAKEN)\n\n' );
        ok = true;
    else
        fprintf( 'RESULT: FAIL (fix the items above before running KRAKEN)\n\n' );
        ok = false;
    end
end



