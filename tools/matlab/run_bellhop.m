function run_bellhop( casename, varargin )
% RUN_BELLHOP  Safe wrapper to validate, run, and plot a BELLHOP case.
%
%   run_bellhop( casename )
%   run_bellhop( casename, 'Name', value, ... )
%
% PURPOSE
%   One-call front-end around the Acoustics Toolbox (AT) BELLHOP binary that
%   makes it hard to launch a malformed or mis-configured run. It:
%     1. Ensures the AT Matlab tree and the Linux binary directory are on the
%        MATLAB path so which('bellhop.exe') resolves to the ELF executable
%        (the binary is named *.exe but is a genuine Linux ELF, see README).
%     2. Validates casename.env with validate_bellhop_env and ABORTS with a
%        clear error if validation fails.
%     3. Runs bellhop( casename ) (no extension, as the AT wrapper expects).
%     4. Reads the .shd field with read_shd and produces a transmission-loss
%        plot (depth increasing downward, range in km, dB colorbar).
%     5. Optionally plots rays via plotray for ray/eigenray run types.
%
% INPUT
%   casename : char row vector or string scalar.
%              The case name WITHOUT the .env extension (BELLHOP appends it).
%              casename.env must exist in the current working directory (pwd),
%              because the binary runs in pwd.
%
% OPTIONAL NAME-VALUE ARGUMENTS
%   'AtRoot'   : char. Path to the AT install root. Default is the verified
%                local install (see DEF.atRoot below).
%   'PlotRays' : logical scalar (default false). If true, also call plotray
%                on casename.ray. Only meaningful for ray/eigenray runs.
%   'Freq'     : numeric scalar (default NaN). Frequency to select when
%                reading a broadband .shd (passed through to read_shd).
%   'Validate' : logical scalar (default true). If false, skip the validator
%                (NOT recommended; provided only for debugging known-good files).
%
% OUTPUT
%   None. Figures are created as a side effect.
%
% ERRORS (all raised with identifier 'runBellhop:*' and a clear message)
%   runBellhop:badInput     - casename empty or wrong type.
%   runBellhop:noEnv        - casename.env not found in pwd.
%   runBellhop:validation   - validate_bellhop_env returned false.
%   runBellhop:noBinary     - which('bellhop.exe') did not resolve.
%   runBellhop:noOutput     - expected .shd/.ray output missing after the run.
%
% EXAMPLE
%   cd /path/to/case            % directory containing Pekeris.env
%   run_bellhop( 'Pekeris' );
%   run_bellhop( 'Munk', 'PlotRays', false, 'Freq', 50 );
%
% SEE ALSO
%   validate_bellhop_env, bellhop, read_shd, plotshd, plotray

    % ---- documented defaults (no bare magic numbers) -----------------------
    DEF.atRoot  = '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4';
    DEF.tlFloor = 1e-37;   % abs(pressure) below this is floored before log10
    DEF.binName = 'bellhop.exe';   % literal name resolved via which() on Linux too

    % ---- parse inputs ------------------------------------------------------
    if ( nargin < 1 || isempty( casename ) || ~( ischar( casename ) || isstring( casename ) ) )
        error( 'runBellhop:badInput', ...
            'casename must be a non-empty char/string giving the case name WITHOUT the .env extension.' );
    end
    casename = char( casename );
    % Strip a stray .env if the caller included it (bellhop.m wants no ext).
    [ cp, cn, ce ] = fileparts( casename );
    if ( strcmpi( ce, '.env' ) )
        casename = fullfile( cp, cn );
    end

    opt = local_parse_opts( varargin, DEF );

    % ---- ensure the AT path is set up so binaries/scripts resolve ----------
    local_ensure_path( opt.AtRoot, DEF.binName );

    % ---- validate the .env before doing anything expensive ----------------
    envfile = [ casename '.env' ];
    if ( exist( envfile, 'file' ) ~= 2 )
        error( 'runBellhop:noEnv', ...
            [ 'Environment file "%s" not found in the current directory (%s).\n', ...
              'cd into the directory that contains %s before calling run_bellhop.' ], ...
            envfile, pwd, envfile );
    end

    if ( opt.Validate )
        ok = validate_bellhop_env( envfile );
        if ( ~ok )
            error( 'runBellhop:validation', ...
                [ 'validate_bellhop_env reported FAIL for "%s". The run was aborted.\n', ...
                  'Fix the FAIL items listed above and re-run. (Pass ''Validate'',false to override,\n', ...
                  'but this is not recommended.)' ], envfile );
        end
    end

    % ---- confirm the binary actually resolves ------------------------------
    binPath = which( DEF.binName );
    if ( isempty( binPath ) )
        error( 'runBellhop:noBinary', ...
            [ '%s not found on the MATLAB path even after addpath.\n', ...
              'Check that %s exists and is executable (chmod +x).' ], ...
            DEF.binName, fullfile( opt.AtRoot, 'linux-bin', DEF.binName ) );
    end
    fprintf( 'Using BELLHOP binary: %s\n', binPath );

    % ---- clear stale outputs so a failed run cannot be mis-plotted ---------
    % BELLHOP overwrites on success, but a run that aborts leaves the previous
    % .shd/.prt in place and local_plot_tl would then draw a stale field.
    for ext = { '.shd', '.prt', '.ray', '.arr' }
        stale = [ casename ext{1} ];
        if ( exist( stale, 'file' ) )
            delete( stale );
        end
    end

    % ---- run BELLHOP -------------------------------------------------------
    fprintf( 'Running bellhop( ''%s'' ) ...\n', casename );
    bellhop( casename );

    % ---- confirm the run actually produced output --------------------------
    % A failed run leaves the .prt log but no field/ray/arrivals file. Gate
    % here so we do not silently plot a stale or empty result.
    produced = false;
    for ext = { '.shd', '.ray', '.arr' }
        f = [ casename ext{1} ];
        d = dir( f );
        if ( ~isempty( d ) && d.bytes > 0 )
            produced = true;
            break;
        end
    end
    if ( ~produced )
        error( 'runBellhop:noOutput', ...
            [ 'BELLHOP produced no non-empty .shd/.ray/.arr for "%s". ', ...
              'The run likely failed; inspect "%s.prt" for the error.' ], ...
            casename, casename );
    end

    % ---- plot results ------------------------------------------------------
    local_plot_tl( casename, opt, DEF );

    if ( opt.PlotRays )
        local_plot_rays( casename );
    end
end

% ========================================================================
% Local helper functions
% ========================================================================

function opt = local_parse_opts( args, DEF )
% LOCAL_PARSE_OPTS  Parse Name-Value pairs into a validated options struct.
    opt.AtRoot   = DEF.atRoot;
    opt.PlotRays = false;
    opt.Freq     = NaN;
    opt.Validate = true;

    if ( mod( numel( args ), 2 ) ~= 0 )
        error( 'runBellhop:badInput', ...
            'Optional arguments must be Name-Value pairs; got an odd number of extra args.' );
    end
    for ii = 1 : 2 : numel( args )
        name = args{ ii };
        val  = args{ ii + 1 };
        if ( ~( ischar( name ) || isstring( name ) ) )
            error( 'runBellhop:badInput', 'Option names must be strings.' );
        end
        switch lower( char( name ) )
            case 'atroot'
                if ( ~( ischar( val ) || isstring( val ) ) )
                    error( 'runBellhop:badInput', '''AtRoot'' must be a path string.' );
                end
                opt.AtRoot = char( val );
            case 'plotrays'
                if ( ~( islogical( val ) && isscalar( val ) ) )
                    error( 'runBellhop:badInput', '''PlotRays'' must be a logical scalar (true/false).' );
                end
                opt.PlotRays = val;
            case 'freq'
                if ( ~( isnumeric( val ) && isscalar( val ) ) )
                    error( 'runBellhop:badInput', '''Freq'' must be a numeric scalar (Hz).' );
                end
                opt.Freq = val;
            case 'validate'
                if ( ~( islogical( val ) && isscalar( val ) ) )
                    error( 'runBellhop:badInput', '''Validate'' must be a logical scalar (true/false).' );
                end
                opt.Validate = val;
            otherwise
                error( 'runBellhop:badInput', 'Unknown option ''%s''.', char( name ) );
        end
    end
end

function local_ensure_path( atRoot, binName )
% LOCAL_ENSURE_PATH  Put the AT Matlab tree and linux-bin on the MATLAB path.
%   Idempotent: adds the directories only if which(binName) does not already
%   resolve, so repeated calls in a session are cheap.
    if ( exist( atRoot, 'dir' ) ~= 7 )
        error( 'runBellhop:noBinary', ...
            'AT root directory does not exist: %s. Pass a valid ''AtRoot''.', atRoot );
    end
    matlabDir = fullfile( atRoot, 'Matlab' );
    binDir    = fullfile( atRoot, 'linux-bin' );

    if ( exist( matlabDir, 'dir' ) == 7 )
        addpath( genpath( matlabDir ) );
    else
        warning( 'runBellhop:noBinary', 'AT Matlab directory not found: %s', matlabDir );
    end
    if ( exist( binDir, 'dir' ) == 7 )
        addpath( binDir );
    else
        error( 'runBellhop:noBinary', ...
            'AT linux-bin directory not found: %s (needed so which(''%s'') resolves).', binDir, binName );
    end
end

function local_plot_tl( casename, opt, DEF )
% LOCAL_PLOT_TL  Read the .shd field and draw a transmission-loss surface.
%   Conventions: depth axis increases downward, range axis in km, TL in dB,
%   reversed colormap, title = casename. Points the user to the .prt file if
%   the .shd is missing or empty.
    shdfile = [ casename '.shd' ];
    if ( exist( shdfile, 'file' ) ~= 2 )
        fprintf( 2, [ 'No shade file "%s" was produced. This is expected for ray/eigenray/arrivals\n', ...
                      'runs (which write .ray/.arr instead). For TL runs, inspect "%s.prt" for errors.\n' ], ...
                 shdfile, casename );
        return;
    end

    if ( isnan( opt.Freq ) )
        [ ~, ~, ~, ~, ~, Pos, pressure ] = read_shd( shdfile );
    else
        [ ~, ~, ~, ~, ~, Pos, pressure ] = read_shd( shdfile, opt.Freq );
    end

    if ( isempty( pressure ) || all( abs( pressure(:) ) == 0 ) )
        fprintf( 2, [ 'Shade file "%s" is empty or all-zero (no field computed).\n', ...
                      'Check "%s.prt" for warnings, and verify ZBOX/RBOX exceed the\n', ...
                      'deepest receiver depth and max range.\n' ], shdfile, casename );
        return;
    end

    % read_shd_bin returns a 4-D array p(Ntheta, Nsz, Nrz, Nrr); take the
    % first bearing and first source, leaving an Nrz x Nrr slice.
    p2d = squeeze( pressure( 1, 1, :, : ) );

    rangeKm = Pos.r.r / 1000.0;   % Pos.r.r is in metres internally; convert to km
    depthM  = Pos.r.z;

    tl = abs( p2d );
    tl( tl < DEF.tlFloor ) = DEF.tlFloor;   % avoid log10(0)
    tl = -20.0 * log10( tl );

    figure;
    pcolor( rangeKm, depthM, tl );
    shading( 'flat' );
    set( gca, 'YDir', 'reverse' );          % depth increases downward
    colormap( flipud( jet ) );              % reversed jet: low TL (strong) = warm
    cb = colorbar;
    ylabel( cb, 'TL (dB)' );
    xlabel( 'Range (km)' );
    ylabel( 'Depth (m)' );
    title( casename, 'Interpreter', 'none' );
end

function local_plot_rays( casename )
% LOCAL_PLOT_RAYS  Plot ray trajectories from the .ray file, if present.
    rayfile = [ casename '.ray' ];
    if ( exist( rayfile, 'file' ) ~= 2 )
        fprintf( 2, [ 'PlotRays requested but no ray file "%s" was produced.\n', ...
                      'Ray output requires a ray (R) or eigenray (E) run type.\n', ...
                      'Check "%s.prt".\n' ], rayfile, casename );
        return;
    end
    % plotray uses global units/jkpsflag; initialise to sane defaults so the
    % function does not warn about empty globals and draws in km.
    global units jkpsflag %#ok<GVMIS>
    if ( isempty( units ) );    units = 'km';   end
    if ( isempty( jkpsflag ) ); jkpsflag = 0;   end
    figure;
    plotray( rayfile );
    title( casename, 'Interpreter', 'none' );
end
