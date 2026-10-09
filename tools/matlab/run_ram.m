function run_ram( infile, varargin )
% RUN_RAM  Safe wrapper to validate, run, and plot a RAM (PE) case on Linux.
%
%   run_ram( infile )
%   run_ram( infile, 'Name', value, ... )
%
% PURPOSE
%   One-call front-end around the RAM parabolic-equation binary that makes it
%   hard to launch a malformed or mis-configured run. It:
%     1. Validates infile with validate_ram_in and ABORTS with a clear error
%        if validation fails.
%     2. Uses the VERIFIED Linux ELF binary at DEF.ramBin directly via
%        system(), instead of which('ram.exe') which on this machine may
%        resolve a Mach-O (macOS) binary that cannot execute on Linux.
%     3. RAM always reads a file literally named "ram.in" from the run
%        directory (hard-coded open in ram1.5.f), so if infile is not already
%        named ram.in it is COPIED to ram.in in the run directory first.
%     4. Clears stale tl.grid / tl.line so a failed run cannot be mis-plotted.
%     5. Runs the binary, then reads tl.grid via read_ram_tlgrid and draws a
%        transmission-loss field plot (depth downward, range in km, TL in dB).
%     6. Points the user to the captured console output if tl.grid is missing.
%
% INPUT
%   infile : char row vector or string scalar.
%            Path to the RAM input file. May be any name; if it is not
%            literally "ram.in" it is copied to ram.in in the run directory.
%            By default the run directory is the directory that contains
%            infile (or pwd if infile is a bare name).
%
% OPTIONAL NAME-VALUE ARGUMENTS
%   'RamBin'   : char. Full path to the working ELF RAM binary. Default is the
%                verified local ELF build (see DEF.ramBin below). The stock
%                AT ram.m uses which('ram.exe') which may find a Mach-O build;
%                this wrapper calls the verified path directly to avoid that.
%   'AtRoot'   : char. Path to the AT install root that holds the Matlab tree
%                (needed so read_ram_tlgrid resolves). Default below.
%   'RunDir'   : char. Directory to run RAM in. Default is the folder of infile
%                (or pwd if infile has no path). ram.in and outputs live here.
%   'Validate' : logical scalar (default true). If false, skip validate_ram_in
%                (NOT recommended; provided only for known-good files).
%
% OUTPUT
%   None. A TL-field figure is created as a side effect.
%
% ERRORS (all raised with identifier 'runRam:*' and a clear message)
%   runRam:badInput   - infile empty or wrong type, or bad option value.
%   runRam:noInput    - infile not found.
%   runRam:noBinary   - the RAM binary path does not exist.
%   runRam:validation - validate_ram_in returned false.
%   runRam:runFailed  - the binary returned a non-zero exit status.
%
% EXAMPLE
%   cd /home/jay/temp/ram_run     % directory that will hold ram.in + outputs
%   validate_ram_in( 'ram.in' );
%   run_ram( 'ram.in' );          % validates, runs, plots the TL field
%   run_ram( 'wedge.in' );        % copied to ram.in first, then run
%
% SEE ALSO
%   validate_ram_in, read_ram_tlgrid, run_bellhop, validate_bellhop_env

    % ---- documented defaults (no bare magic numbers) -----------------------
    DEF.ramBin   = '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM/ram.exe';
    DEF.atRoot   = '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4';
    DEF.tlFloor  = 1e-37;   % abs(pressure) below this is floored before log10
    DEF.dynRange = 70.0;    % dB window below the strongest return for caxis
    DEF.ramName  = 'ram.in';  % the FIXED filename RAM opens in the run dir
    DEF.gridName = 'tl.grid'; % binary TL field, read by read_ram_tlgrid
    DEF.lineName = 'tl.line'; % ascii range,TL at the receiver depth
    DEF.logName  = 'ram.log'; % captured stdout/stderr from the binary
    DEF.gridHeaderBytes = 100; % tl.grid <= this many bytes == header-only (crash); real fields are >100 KB

    % ---- parse inputs ------------------------------------------------------
    if ( nargin < 1 || isempty( infile ) || ~( ischar( infile ) || isstring( infile ) ) )
        error( 'runRam:badInput', ...
            'infile must be a non-empty char/string giving the path to a RAM input file.' );
    end
    infile = char( infile );
    if ( exist( infile, 'file' ) ~= 2 )
        error( 'runRam:noInput', ...
            'RAM input file "%s" not found. Pass a valid path to a ram.in-style file.', infile );
    end

    opt = local_parse_opts( varargin, DEF );

    % ---- validate before doing anything expensive -------------------------
    if ( opt.Validate )
        ok = validate_ram_in( infile );
        if ( ~ok )
            error( 'runRam:validation', ...
                [ 'validate_ram_in reported FAIL for "%s". The run was aborted.\n', ...
                  'Fix the FAIL items listed above and re-run. (Pass ''Validate'',false to override,\n', ...
                  'but this is not recommended.)' ], infile );
        end
    end

    % ---- confirm the working ELF binary actually exists -------------------
    if ( exist( opt.RamBin, 'file' ) ~= 2 )
        error( 'runRam:noBinary', ...
            [ 'RAM binary not found at "%s".\n', ...
              'Pass a valid ''RamBin'' path to the working Linux ELF build.' ], opt.RamBin );
    end

    % ---- ensure the AT Matlab tree is on the path for read_ram_tlgrid -----
    local_ensure_path( opt.AtRoot );

    % ---- decide the run directory -----------------------------------------
    runDir = local_resolve_rundir( infile, opt );
    fprintf( 'RAM run directory: %s\n', runDir );

    % ---- stage infile as ram.in (the FIXED name RAM opens) ----------------
    local_stage_input( infile, runDir, DEF );

    % ---- run RAM in runDir and plot the field -----------------------------
    cwd = pwd;
    cleanupObj = onCleanup( @() cd( cwd ) );   % guarantee we return to cwd
    cd( runDir );

    % clear stale outputs so a failed run cannot be mis-plotted
    for f = { DEF.gridName, DEF.lineName }
        if ( exist( f{1}, 'file' ) )
            delete( f{1} );
        end
    end

    % run the verified ELF binary directly (NOT which('ram.exe'))
    fprintf( 'Using RAM binary: %s\n', opt.RamBin );
    cmd = sprintf( '"%s" > "%s" 2>&1', opt.RamBin, DEF.logName );
    [ status, ~ ] = system( cmd );
    if ( status ~= 0 )
        error( 'runRam:runFailed', ...
            [ 'RAM exited with non-zero status %d.\n', ...
              'See "%s" in %s for the captured console output.' ], ...
            status, DEF.logName, runDir );
    end

    % ---- plot the TL field -------------------------------------------------
    local_plot_tl( infile, runDir, DEF );
end

% ========================================================================
% Local helper functions
% ========================================================================

function opt = local_parse_opts( args, DEF )
% LOCAL_PARSE_OPTS  Parse Name-Value pairs into a validated options struct.
    opt.RamBin   = DEF.ramBin;
    opt.AtRoot   = DEF.atRoot;
    opt.RunDir   = '';      % empty -> resolve from infile later
    opt.Validate = true;

    if ( mod( numel( args ), 2 ) ~= 0 )
        error( 'runRam:badInput', ...
            'Optional arguments must be Name-Value pairs; got an odd number of extra args.' );
    end
    for ii = 1 : 2 : numel( args )
        name = args{ ii };
        val  = args{ ii + 1 };
        if ( ~( ischar( name ) || isstring( name ) ) )
            error( 'runRam:badInput', 'Option names must be strings.' );
        end
        switch lower( char( name ) )
            case 'rambin'
                if ( ~( ischar( val ) || isstring( val ) ) )
                    error( 'runRam:badInput', '''RamBin'' must be a path string.' );
                end
                opt.RamBin = char( val );
            case 'atroot'
                if ( ~( ischar( val ) || isstring( val ) ) )
                    error( 'runRam:badInput', '''AtRoot'' must be a path string.' );
                end
                opt.AtRoot = char( val );
            case 'rundir'
                if ( ~( ischar( val ) || isstring( val ) ) )
                    error( 'runRam:badInput', '''RunDir'' must be a path string.' );
                end
                opt.RunDir = char( val );
            case 'validate'
                if ( ~( islogical( val ) && isscalar( val ) ) )
                    error( 'runRam:badInput', '''Validate'' must be a logical scalar (true/false).' );
                end
                opt.Validate = val;
            otherwise
                error( 'runRam:badInput', 'Unknown option ''%s''.', char( name ) );
        end
    end
end

function local_ensure_path( atRoot )
% LOCAL_ENSURE_PATH  Put the AT Matlab tree on the path so read_ram_tlgrid resolves.
    if ( exist( 'read_ram_tlgrid', 'file' ) == 2 )
        return;   % already resolvable, nothing to do
    end
    if ( exist( atRoot, 'dir' ) ~= 7 )
        error( 'runRam:noBinary', ...
            'AT root directory does not exist: %s. Pass a valid ''AtRoot''.', atRoot );
    end
    matlabDir = fullfile( atRoot, 'Matlab' );
    if ( exist( matlabDir, 'dir' ) == 7 )
        addpath( genpath( matlabDir ) );
    else
        warning( 'runRam:noBinary', 'AT Matlab directory not found: %s', matlabDir );
    end
end

function runDir = local_resolve_rundir( infile, opt )
% LOCAL_RESOLVE_RUNDIR  Decide where RAM runs: explicit RunDir, else infile dir.
    if ( ~isempty( opt.RunDir ) )
        runDir = opt.RunDir;
        if ( exist( runDir, 'dir' ) ~= 7 )
            [ ok, msg ] = mkdir( runDir );
            if ( ~ok )
                error( 'runRam:badInput', 'Could not create RunDir "%s": %s', runDir, msg );
            end
        end
        return;
    end
    inDir = fileparts( infile );
    if ( isempty( inDir ) )
        runDir = pwd;
    else
        runDir = inDir;
    end
end

function local_stage_input( infile, runDir, DEF )
% LOCAL_STAGE_INPUT  Ensure a file named ram.in exists in runDir.
%   RAM hard-codes open(file='ram.in'), so any other name must be copied to
%   ram.in. If infile already IS the ram.in in runDir, nothing is copied.
    target = fullfile( runDir, DEF.ramName );
    inFull = local_abspath( infile );
    tgFull = local_abspath( target );
    if ( strcmp( inFull, tgFull ) )
        return;   % infile already is runDir/ram.in
    end
    [ ok, msg ] = copyfile( infile, target );
    if ( ~ok )
        error( 'runRam:badInput', ...
            'Could not stage "%s" as "%s": %s', infile, target, msg );
    end
    fprintf( 'Staged "%s" -> "%s" (RAM requires the fixed name ram.in).\n', infile, target );
end

function p = local_abspath( f )
% LOCAL_ABSPATH  Best-effort absolute, normalised path for comparison.
    d = fileparts( f );
    if ( isempty( d ) )
        f = fullfile( pwd, f );
    elseif ( exist( d, 'dir' ) == 7 )
        f = fullfile( local_realdir( d ), local_name( f ) );
    end
    p = f;
end

function d = local_realdir( d )
% LOCAL_REALDIR  Resolve a directory to its canonical absolute form.
    cwd = pwd;
    try
        cd( d );
        d = pwd;
        cd( cwd );
    catch
        cd( cwd );
    end
end

function nm = local_name( f )
% LOCAL_NAME  Filename + extension portion of a path.
    [ ~, n, e ] = fileparts( f );
    nm = [ n e ];
end

function local_plot_tl( infile, runDir, DEF )
% LOCAL_PLOT_TL  Read tl.grid and draw a transmission-loss field.
%   Conventions: depth axis increases downward, range axis in km, TL in dB,
%   reversed colormap. Points the user to the console log if tl.grid is absent.
    gridFull = fullfile( runDir, DEF.gridName );
    if ( exist( gridFull, 'file' ) ~= 2 )
        fprintf( 2, [ 'No "%s" was produced in %s.\n', ...
                      'RAM probably aborted early (a common cause is km-not-METERS ranges,\n', ...
                      'making rmax tiny). Inspect the captured console output in "%s".\n' ], ...
                 DEF.gridName, runDir, fullfile( runDir, DEF.logName ) );
        return;
    end

    % A crashed RAM run returns exit status 0 (Fortran STOP) but leaves only the
    % ~68-byte header in tl.grid with no field data. Treat a tiny file as a crash
    % so read_ram_tlgrid does not die on a raw fread dimension error.
    gridInfo = dir( gridFull );
    if ( ~isempty( gridInfo ) && gridInfo.bytes <= DEF.gridHeaderBytes )
        fprintf( 2, [ '"%s" is only %d bytes (header only) -> RAM wrote the header then stopped.\n', ...
                      'Inspect "%s" for the abort reason (often a malformed ram.in line).\n' ], ...
                 DEF.gridName, gridInfo.bytes, fullfile( runDir, DEF.logName ) );
        return;
    end

    % read_ram_tlgrid reads tl.grid from the CURRENT directory (we are in runDir).
    try
        [ PlotTitle, ~, freq, ~, Pos, pressure ] = read_ram_tlgrid( );
    catch err
        fprintf( 2, [ 'Failed to parse "%s" (%s).\n', ...
                      'The file is likely truncated from an aborted run; inspect "%s".\n' ], ...
                 DEF.gridName, err.message, fullfile( runDir, DEF.logName ) );
        return;
    end

    if ( isempty( pressure ) || all( abs( pressure(:) ) == 0 ) )
        fprintf( 2, [ '"%s" is empty or all-zero (no field computed).\n', ...
                      'Inspect "%s" for RAM messages.\n' ], DEF.gridName, fullfile( runDir, DEF.logName ) );
        return;
    end

    % pressure is [1,1,lz,lr] with the inverse-dB amplitude 10.^(-TL/20);
    % invert to recover TL in dB (run_ram.m / read_ram_tlgrid convention).
    tl = abs( squeeze( pressure ) );        % [lz (depth) x lr (range)]
    tl( tl < DEF.tlFloor ) = DEF.tlFloor;   % avoid log10(0)
    tl = -20.0 * log10( tl );

    rangeKm = Pos.r.range / 1000.0;   % Pos.r.range is METERS in RAM -> km display
    depthM  = Pos.r.z;                % METERS, downward

    figure;
    imagesc( rangeKm, depthM, tl );
    axis ij;                          % depth increases downward
    colormap( flipud( jet ) );        % reversed jet: low TL (strong) = warm
    cb = colorbar;
    ylabel( cb, 'TL (dB)' );
    xlabel( 'Range (km)' );
    ylabel( 'Depth (m)' );
    % ~dynRange-dB window from the strongest (lowest-TL) return
    tlMin = min( tl(:) );
    clim( [ tlMin, tlMin + DEF.dynRange ] );
    title( sprintf( '%s  TL field  (%.0f Hz)  [%s]', PlotTitle, freq, local_name( infile ) ), ...
        'Interpreter', 'none' );
end
