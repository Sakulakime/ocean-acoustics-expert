function ok = validate_ram_in( infile )
% VALIDATE_RAM_IN  Line-level sanity checker for a RAM (PE) ram.in input file.
%
%   ok = validate_ram_in( infile )
%
% PURPOSE
%   The RAM Fortran reader (ram1.5.f / ramgeo1.5.f) parses ram.in with
%   list-directed reads (read(1,*)) and a strict, fixed block order. When a
%   file is malformed the reader either dies deep in the stack or, worse,
%   silently de-syncs: a missing "-1 -1" sentinel makes the next block's data
%   get read as this block's, corrupting everything downstream with no error.
%   This validator front-runs RAM and reports EVERY problem it finds with the
%   offending line number and a concrete fix hint, so an AI agent or a user
%   cannot easily launch a malformed run.
%
%   It re-implements a line-tracking parser that follows the SAME read order
%   as the Fortran (setup -> bathymetry -> profl{cw,cb,rhob,attn} -> rp -> ...)
%   so the diagnostics match what RAM will actually do.
%
% INPUT
%   infile : char row vector or string scalar.
%            Path to the RAM input file. RAM itself always opens a file named
%            literally "ram.in" in the run directory, but this validator works
%            on any path so you can check a case file before staging it.
%
% OUTPUT
%   ok     : logical scalar.
%            true  -> no FAIL-level problems were found (WARN/INFO may print).
%            false -> at least one FAIL-level problem; do NOT run RAM.
%
% CHECKS PERFORMED (FAIL unless noted)
%   - Title line present (line 1 is consumed unconditionally by the reader).
%   - Line 2 "freq zs zr": 3 numbers, freq > 0, zs/zr >= 0.
%   - Line 3 "rmax dr ndr": 3 numbers, rmax > 0, dr > 0, ndr >= 1 integer.
%   - Line 4 "zmax dz ndz zmplt": 4 numbers, zmax > 0, dz > 0, ndz >= 1,
%     zmplt <= zmax.
%   - Line 5 "c0 np ns rs": 4 numbers, c0 in a plausible band (~1400-1550,
%     WARN if outside), np integer (WARN outside the typical 4-8 band, FAIL if
%     np > 30 the ram compile limit), ns >= 0, rs >= 0.
%   - Bathymetry block: each row has 2 numbers, rb non-decreasing, ends with a
%     "-1 -1" sentinel; at least one real row before the sentinel.
%   - Each profile group is exactly four sub-blocks in fixed order
%     (water SSP, bottom SSP, density, attenuation); each has >= 1 real row,
%     strictly increasing depths, and a "-1 -1" sentinel.
%   - Optional "rp" update-range line is a single bare number (not a pair, not
%     a sentinel); successive rp values strictly increasing.
%   - METERS-vs-km trap (WARN heuristic): every range/depth in RAM is in
%     METERS, unlike the AT .env/.flp family which uses km. If rmax looks tiny
%     (rmax < 100) while dr < 1, warn that the file may have been written in km.
%
% NOTE ON SCOPE
%   This validates RAM v1.5 / RAMGEO v1.5g ram.in files (the readers are
%   byte-for-byte identical in read order). It does not validate AT
%   .env/.flp files (use validate_bellhop_env for those).
%
% SEE ALSO
%   run_ram, read_ram_tlgrid, validate_bellhop_env, run_bellhop

    % ---- default tuning constants (documented, no bare magic numbers) -------
    DEF.minC0       = 1400.0;   % m/s   plausible lower bound for reference speed
    DEF.maxC0       = 1550.0;   % m/s   plausible upper bound for reference speed
    DEF.minSSP      = 1400.0;   % m/s   plausible lower bound for any sound speed
    DEF.maxSSP      = 2200.0;   % m/s   plausible upper bound (sediment included)
    DEF.npTypLo     = 4;        % --    typical lower bound for # Pade terms
    DEF.npTypHi     = 8;        % --    typical upper bound for # Pade terms
    DEF.npMax       = 30;       % --    compile limit "mp" in ram1.5.f (10 in ramgeo)
    DEF.kmRmaxWarn  = 1000.0;   % m     rmax below this is implausibly small for metres -> likely km slip
    DEF.minRho      = 0.5;      % g/cm3 plausible lower bound for bottom density
    DEF.maxRho      = 3.5;      % g/cm3 plausible upper bound for bottom density
    DEF.sentinel    = -1.0;     % the "-1 -1" sentinel test value (first field < 0)
    DEF.subNames    = { 'water SSP (z cw)', 'bottom SSP (z cb)', ...
                        'density (z rhob)', 'attenuation (z attn)' };
    DEF.subUnits    = { 'm/s', 'm/s', 'g/cm^3', 'dB/wavelength' };

    % ---- resolve filename ---------------------------------------------------
    infile = char( infile );

    fprintf( '\n=== validate_ram_in: %s ===\n', infile );

    % ---- load every physical line, keep 1-based line numbers ----------------
    [ lineText, lineNo, loadErr ] = local_load_lines( infile );
    if ( ~isempty( loadErr ) )
        fprintf( 2, 'FAIL: %s\n', loadErr );
        fprintf( '\nRESULT: FAIL (file could not be read)\n\n' );
        ok = false;
        return;
    end

    % Problem log: struct array with fields {sev,line,msg,hint}.
    P = struct( 'sev', {}, 'line', {}, 'msg', {}, 'hint', {} );

    k      = 1;                 % cursor into lineText/lineNo
    nLines = numel( lineText );

    % ============================ HEADER (5 fixed lines) ====================
    [ P, k, hdr ] = local_check_header( P, lineText, lineNo, k, nLines, DEF );

    % ============================ BATHYMETRY block ==========================
    if ( ~isnan( hdr.rmax ) )
        [ P, k ] = local_check_bathy( P, lineText, lineNo, k, nLines, DEF );
    end

    % ============================ PROFILE group(s) ==========================
    % Initial profile group is mandatory; each trailing "rp" line introduces
    % another. We stop when the cursor runs out or we hit a parse dead-end.
    [ P, ~ ] = local_check_profiles( P, lineText, lineNo, k, nLines, DEF, hdr );

    % ---- final report -------------------------------------------------------
    ok = local_report( P );
end

% ========================================================================
% Local helper functions
% ========================================================================

function [ P, k, hdr ] = local_check_header( P, lineText, lineNo, k, nLines, DEF )
% LOCAL_CHECK_HEADER  Validate the 5 fixed header lines (setup L96-100).
    hdr.rmax = NaN; hdr.dr = NaN; hdr.dz = NaN; hdr.zmax = NaN;
    hdr.zmplt = NaN; hdr.freq = NaN;

    % --- line 1: title (decorative, but one line must exist) ---
    [ k, ~, raw ] = local_next( lineText, lineNo, k, nLines );
    if ( raw < 0 )
        P = local_add( P, 'FAIL', NaN, 'File is empty: no title line.', ...
            'Line 1 must be a (decorative) title line, e.g. "my case".' );
        return;
    end

    % --- line 2: freq zs zr ---
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    v = local_nums( ln );
    if ( raw < 0 || numel( v ) < 3 )
        P = local_add( P, 'FAIL', raw, 'Line 2 must be "freq zs zr" (3 numbers).', ...
            'e.g. 25.0 40.0 30.0  (source freq Hz, source depth m, receiver depth m).' );
    else
        hdr.freq = v(1);
        if ( v(1) <= 0 )
            P = local_add( P, 'FAIL', raw, sprintf( 'Frequency must be > 0 (got %g).', v(1) ), ...
                'Set a positive source frequency in Hz, e.g. 25.0.' );
        end
        if ( v(2) < 0 || v(3) < 0 )
            P = local_add( P, 'FAIL', raw, 'Source/receiver depth must be >= 0 (METERS).', ...
                'zs and zr are depths in metres, e.g. 40.0 30.0.' );
        end
    end

    % --- line 3: rmax dr ndr ---
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    v = local_nums( ln );
    if ( raw < 0 || numel( v ) < 3 )
        P = local_add( P, 'FAIL', raw, 'Line 3 must be "rmax dr ndr" (3 numbers).', ...
            'e.g. 4000.0 5.0 1  (max range m, range step m, range decimation int).' );
    else
        hdr.rmax = v(1); hdr.dr = v(2);
        if ( v(1) <= 0 )
            P = local_add( P, 'FAIL', raw, sprintf( 'rmax must be > 0 (got %g).', v(1) ), ...
                'rmax is the max range in METERS, e.g. 4000.0.' );
        end
        if ( v(2) <= 0 )
            P = local_add( P, 'FAIL', raw, sprintf( 'dr must be > 0 (got %g).', v(2) ), ...
                'dr is the range march step in METERS, e.g. 5.0.' );
        end
        if ( v(3) < 1 || v(3) ~= round( v(3) ) )
            P = local_add( P, 'FAIL', raw, sprintf( 'ndr must be a positive integer (got %g).', v(3) ), ...
                'ndr is a range output DECIMATION factor (every Nth point), not a step.' );
        end
        % --- METERS-vs-km trap (heuristic WARN) ---
        % Fire whenever rmax is implausibly small for metres (a real-ocean RAM
        % run is usually thousands of m). Using rmax alone (not rmax AND dr)
        % catches the common slip rmax=30, dr=5 that the AND form missed.
        if ( v(1) < DEF.kmRmaxWarn )
            P = local_add( P, 'WARN', raw, ...
                sprintf( 'rmax=%g m is very small; if you meant kilometres note RAM uses METERS (multiply by 1000).', v(1) ), ...
                'RAM ranges/depths are all in METERS (unlike AT .env/.flp km). For 30 km write 30000.' );
        end
    end

    % --- line 4: zmax dz ndz zmplt ---
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    v = local_nums( ln );
    if ( raw < 0 || numel( v ) < 4 )
        P = local_add( P, 'FAIL', raw, 'Line 4 must be "zmax dz ndz zmplt" (4 numbers).', ...
            'e.g. 1000.0 1.0 2 1000.0  (max depth m, depth step m, depth decimation, max plotted depth m).' );
    else
        hdr.zmax = v(1); hdr.dz = v(2); hdr.zmplt = v(4);
        if ( v(1) <= 0 )
            P = local_add( P, 'FAIL', raw, sprintf( 'zmax must be > 0 (got %g).', v(1) ), ...
                'zmax is the max computational depth in METERS.' );
        end
        if ( v(2) <= 0 )
            P = local_add( P, 'FAIL', raw, sprintf( 'dz must be > 0 (got %g).', v(2) ), ...
                'dz is the depth grid step in METERS, e.g. 1.0.' );
        end
        if ( v(3) < 1 || v(3) ~= round( v(3) ) )
            P = local_add( P, 'FAIL', raw, sprintf( 'ndz must be a positive integer (got %g).', v(3) ), ...
                'ndz is a depth output DECIMATION factor, not a step size.' );
        end
        if ( ~isnan( hdr.zmax ) && v(4) > hdr.zmax )
            P = local_add( P, 'FAIL', raw, sprintf( 'zmplt (%g) must be <= zmax (%g).', v(4), hdr.zmax ), ...
                'The plotted/output depth zmplt cannot exceed the computational depth zmax.' );
        end
    end

    % --- line 5: c0 np ns rs ---
    [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
    v = local_nums( ln );
    if ( raw < 0 || numel( v ) < 4 )
        P = local_add( P, 'FAIL', raw, 'Line 5 must be "c0 np ns rs" (4 numbers).', ...
            'e.g. 1500.0 8 1 0.0  (ref speed m/s, #Pade terms, #stability constraints, rs m).' );
    else
        if ( v(1) < DEF.minC0 || v(1) > DEF.maxC0 )
            P = local_add( P, 'WARN', raw, ...
                sprintf( 'Reference speed c0=%g m/s is outside the usual %g-%g band.', v(1), DEF.minC0, DEF.maxC0 ), ...
                'c0 is a reference sound speed in m/s; typical ocean values are ~1500.' );
        end
        if ( v(2) ~= round( v(2) ) || v(2) < 1 )
            P = local_add( P, 'FAIL', raw, sprintf( 'np (#Pade terms) must be a positive integer (got %g).', v(2) ), ...
                'np is the number of Pade terms; typical values are 4-8.' );
        elseif ( v(2) > DEF.npMax )
            P = local_add( P, 'FAIL', raw, sprintf( 'np=%d exceeds the compile limit mp=%d (run aborts).', round(v(2)), DEF.npMax ), ...
                'Reduce np to <= 30 (ram) or <= 10 (ramgeo). Typical np is 4-8.' );
        elseif ( v(2) < DEF.npTypLo || v(2) > DEF.npTypHi )
            P = local_add( P, 'WARN', raw, ...
                sprintf( 'np=%d is outside the typical %d-%d range.', round(v(2)), DEF.npTypLo, DEF.npTypHi ), ...
                'Most cases use np = 4-8 Pade terms.' );
        end
        if ( v(3) < 0 || v(3) ~= round( v(3) ) )
            P = local_add( P, 'FAIL', raw, sprintf( 'ns (#stability constraints) must be a non-negative integer (got %g).', v(3) ), ...
                'ns is the number of stability constraints, e.g. 1.' );
        end
        if ( v(4) < 0 )
            P = local_add( P, 'FAIL', raw, sprintf( 'rs must be >= 0 (got %g).', v(4) ), ...
                'rs is the stability-constraint range in METERS; 0.0 means apply everywhere.' );
        end
    end
end

function [ P, k ] = local_check_bathy( P, lineText, lineNo, k, nLines, DEF )
% LOCAL_CHECK_BATHY  Validate the bathymetry "rb zb" pairs + "-1 -1" sentinel.
    [ P, k, nRows, lastLine ] = local_check_block( P, lineText, lineNo, k, nLines, DEF, ...
        'bathymetry (rb zb)', 'm', false );
    if ( nRows == 0 )
        P = local_add( P, 'FAIL', lastLine, ...
            'Bathymetry block has no data row before its "-1 -1" sentinel.', ...
            'Provide at least one "rb zb" pair (range m, bottom depth m), e.g. 0.0 200.0.' );
    end
end

function [ P, k ] = local_check_profiles( P, lineText, lineNo, k, nLines, DEF, hdr )
% LOCAL_CHECK_PROFILES  Validate one-or-more profile groups, each four ordered
%   sub-blocks (cw, cb, rhob, attn), with optional "rp" update-range lines.
    group   = 0;
    prevRp  = -Inf;
    while ( k <= nLines )
        group = group + 1;
        for s = 1 : 4
            [ P, k, nRows, lastLine ] = local_check_block( P, lineText, lineNo, k, nLines, DEF, ...
                DEF.subNames{ s }, DEF.subUnits{ s }, true );
            if ( nRows == 0 )
                P = local_add( P, 'FAIL', lastLine, ...
                    sprintf( 'Profile group %d, sub-block "%s" has no real row before "-1 -1".', group, DEF.subNames{ s } ), ...
                    'zread reads the FIRST row before the sentinel test, so an empty block eats the "-1 -1" and de-syncs. Add >= 1 data row.' );
            end
            if ( k > nLines )
                if ( s < 4 )
                    P = local_add( P, 'FAIL', NaN, ...
                        sprintf( 'File ended mid profile group %d: only %d of 4 sub-blocks (cw, cb, rhob, attn) present.', group, s ), ...
                        'Every profile group needs all four sub-blocks, each ending in "-1 -1".' );
                end
                return;
            end
        end

        % After a complete group, the reader does read(1,*,end=1) rp. EOF here
        % means "no more updates" (range-independent tail). A present number is
        % a single bare update range (m); a pair/sentinel here is malformed.
        if ( k > nLines )
            return;   % clean EOF: range-independent file ends here.
        end
        [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
        v = local_nums( ln );
        if ( isempty( v ) )
            P = local_add( P, 'FAIL', raw, 'Expected an "rp" update-range line but found no number.', ...
                'rp is a single bare range value in METERS on its own line; remove the line to end updates.' );
            return;
        end
        if ( numel( v ) >= 2 && v(2) < DEF.sentinel + eps )
            % Looks like a stray "-1 -1" where an rp number was expected.
            P = local_add( P, 'FAIL', raw, 'Found a "-1 -1"-style pair where a single "rp" range was expected.', ...
                'rp must be ONE bare number (the next-profile range in m), not a sentinel pair.' );
            return;
        end
        if ( numel( v ) > 1 )
            P = local_add( P, 'WARN', raw, ...
                sprintf( 'rp line has %d numbers; only the first (%g) is read as the update range.', numel( v ), v(1) ), ...
                'Write rp as a single bare range value in METERS on its own line.' );
        end
        rp = v(1);
        if ( rp <= prevRp )
            P = local_add( P, 'FAIL', raw, ...
                sprintf( 'rp update ranges must strictly increase (got %g after %g).', rp, prevRp ), ...
                'Each profile-update range rp must be larger than the previous one (METERS).' );
        end
        if ( ~isnan( hdr.rmax ) && rp >= hdr.rmax )
            P = local_add( P, 'WARN', raw, ...
                sprintf( 'rp=%g m is >= rmax=%g m, so this profile update never activates.', rp, hdr.rmax ), ...
                'Put profile-update ranges inside [dr, rmax) or drop the unused group.' );
        end
        prevRp = rp;
    end
end

function [ P, k, nRows, lastLine ] = local_check_block( P, lineText, lineNo, k, nLines, DEF, label, unit, isProfile )
% LOCAL_CHECK_BLOCK  Read rows until a "-1 -1" sentinel (first field < 0).
%   Verifies 2-number rows, monotone first column (strictly increasing depth
%   for profiles, non-decreasing range for bathymetry), and that the sentinel
%   actually appears. Returns the count of real data rows and the last line no.
    nRows    = 0;
    prevX    = -Inf;
    lastLine = NaN;
    sawSent  = false;
    while ( k <= nLines )
        [ k, ln, raw ] = local_next( lineText, lineNo, k, nLines );
        lastLine = raw;
        v = local_nums( ln );
        if ( isempty( v ) )
            P = local_add( P, 'FAIL', raw, sprintf( '%s: unparseable row "%s".', label, ln ), ...
                'Each row needs two numbers, e.g. depth value; terminate the block with "-1 -1".' );
            continue;
        end
        % Sentinel test mirrors Fortran: only the FIRST field is checked.
        if ( v(1) < 0 )
            sawSent = true;
            if ( numel( v ) < 2 )
                P = local_add( P, 'FAIL', raw, sprintf( '%s sentinel has one value; write "-1 -1".', label ), ...
                    'RAM reads two values per row (read(1,*)rb,zb); a lone -1 spans into the next line and eats its first token, desyncing every downstream block.' );
            end
            break;
        end
        % A genuine data row.
        if ( numel( v ) < 2 )
            P = local_add( P, 'FAIL', raw, sprintf( '%s row needs 2 numbers (got %d): "%s".', label, numel( v ), ln ), ...
                sprintf( 'Format is "depth %s", e.g. 0.0 1500.0; end with "-1 -1".', unit ) );
            continue;
        end
        nRows = nRows + 1;
        if ( isProfile )
            if ( v(1) < prevX && nRows > 1 )
                P = local_add( P, 'FAIL', raw, ...
                    sprintf( '%s depths must not decrease (got %g after %g).', label, v(1), prevX ), ...
                    'List profile depths in increasing order; single-row blocks are fine for constants.' );
            elseif ( v(1) == prevX && nRows > 1 )
                P = local_add( P, 'WARN', raw, ...
                    sprintf( '%s has a duplicate depth %g; RAM tolerates this (bumps the grid index by 1) but it is usually a typo.', label, v(1) ), ...
                    'Use distinct increasing depths unless the repeat is intentional.' );
            end
            P = local_check_ssp_range( P, raw, label, unit, v(2), DEF );
        else
            if ( v(1) < prevX )
                P = local_add( P, 'FAIL', raw, ...
                    sprintf( '%s ranges must be non-decreasing (got %g after %g).', label, v(1), prevX ), ...
                    'List bathymetry ranges in non-decreasing order (METERS).' );
            end
        end
        prevX = v(1);
    end
    if ( ~sawSent )
        P = local_add( P, 'FAIL', lastLine, sprintf( '%s block is not terminated by a "-1 -1" sentinel.', label ), ...
            'Every block must end with "-1 -1"; a missing sentinel de-syncs the reader silently.' );
    end
end

function P = local_check_ssp_range( P, raw, label, unit, val, DEF )
% LOCAL_CHECK_SSP_RANGE  Advisory sanity band for profile values (WARN only).
    if ( strcmp( unit, 'm/s' ) )
        if ( val < DEF.minSSP || val > DEF.maxSSP )
            P = local_add( P, 'WARN', raw, ...
                sprintf( '%s value %g m/s is outside the plausible %g-%g band.', label, val, DEF.minSSP, DEF.maxSSP ), ...
                'Check the sound speed; ocean/sediment speeds are typically ~1400-2200 m/s.' );
        end
    elseif ( strcmp( unit, 'g/cm^3' ) )
        if ( val < DEF.minRho || val > DEF.maxRho )
            P = local_add( P, 'WARN', raw, ...
                sprintf( '%s value %g is outside the plausible %g-%g g/cm^3 band.', label, val, DEF.minRho, DEF.maxRho ), ...
                'Bottom density is typically ~1.0-2.5 g/cm^3.' );
        end
    end
end

function [ lineText, lineNo, errMsg ] = local_load_lines( infile )
% LOCAL_LOAD_LINES  Load all non-blank lines, keeping 1-based line numbers.
%   RAM list-directed reads ignore trailing text after the required numbers,
%   so inline labels like "freq zs zr" are harmless; we keep the raw code part
%   and let local_nums extract the leading floats (matching read(1,*)).
    lineText = {};
    lineNo   = [];
    errMsg   = '';
    fid = fopen( infile, 'r' );
    if ( fid == -1 )
        errMsg = sprintf( 'Unable to open RAM input file: %s', infile );
        return;
    end
    n = 0;
    raw = fgetl( fid );
    while ( ischar( raw ) )
        n = n + 1;
        s = strtrim( raw );
        if ( ~isempty( s ) )
            lineText{ end + 1 } = s; %#ok<AGROW>
            lineNo( end + 1 )   = n;  %#ok<AGROW>
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
% LOCAL_NUMS  Extract leading floats from a line (Fortran list-directed style).
%   Stops at a Fortran "/" terminator the way read(1,*) does, so a trailing
%   "/" (legal in RAM sediment rows) does not corrupt the parsed values.
    if ( isempty( s ) )
        v = [];
        return;
    end
    slash = find( s == '/', 1 );
    if ( ~isempty( slash ) )
        s = s( 1 : slash - 1 );
    end
    v = sscanf( s, '%f' )';
end

function P = local_add( P, sev, lineN, msg, hint )
% LOCAL_ADD  Append a problem record (severity, line, message, fix hint).
    P( end + 1 ) = struct( 'sev', sev, 'line', lineN, 'msg', msg, 'hint', hint );
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
        fprintf( 'RESULT: PASS (safe to run RAM)\n\n' );
        ok = true;
    else
        fprintf( 'RESULT: FAIL (fix the items above before running RAM)\n\n' );
        ok = false;
    end
end
