function run_kraken( casename, varargin )
% RUN_KRAKEN  Safe wrapper to validate, run, and plot a KRAKEN case.
%
%   run_kraken( casename )
%   run_kraken( casename, 'Name', value, ... )
%
% PURPOSE
%   One-call front-end around the Acoustics Toolbox (AT) KRAKEN normal-mode
%   model that makes it hard to launch a malformed or mis-configured run. It:
%     1. Ensures the AT Matlab tree (recursively) and the Linux binary
%        directory are on the MATLAB path so which('kraken.exe') and
%        which('field.exe') resolve to the ELF executables (the binaries are
%        named *.exe but are genuine Linux ELF, see README).
%     2. Validates casename.env AND casename.flp with validate_kraken_files and
%        ABORTS with a clear error if validation fails.
%     3. Clears stale outputs (.mod .shd .shd.mat .prt) so a failed run cannot
%        be mis-plotted from a previous run's field.
%     4. Runs kraken( casename ) (or krakenc for the complex/leaky-mode solver
%        when 'Complex',true is passed). The AT wrapper calls field( casename )
%        internally, so this single call computes the modes (.mod/.prt) and the
%        pressure field (.shd.mat).
%     5. Reads the .shd with read_shd and produces a transmission-loss plot
%        (depth increasing downward, range in km, dB colorbar, title = casename).
%     6. Optionally plots mode shapes via plotmode.
%
% INPUT
%   casename : char row vector or string scalar.
%              The case name WITHOUT extension (KRAKEN appends .env, field
%              appends .mod). casename.env and casename.flp must exist in the
%              current working directory (pwd), because the binary runs in pwd.
%
% OPTIONAL NAME-VALUE ARGUMENTS
%   'AtRoot'    : char. Path to the AT install root. Default is the verified
%                 local install (see DEF.atRoot below).
%   'Complex'   : logical scalar (default false). If true, run krakenc (the
%                 complex-wavenumber solver that captures leaky modes and
%                 bottom-loss attenuation) instead of kraken.
%   'PlotModes' : logical scalar (default false). If true, also call plotmode
%                 on casename.mod (wavenumbers + mode shapes).
%   'Freq'      : numeric scalar (default NaN). Frequency to select when
%                 reading a broadband .shd (passed through to read_shd).
%   'Validate'  : logical scalar (default true). If false, skip the validator
%                 (NOT recommended; provided only for known-good files).
%
% OUTPUT
%   None. Figures are created as a side effect.
%
% ERRORS (all raised with identifier 'runKraken:*' and a clear message)
%   runKraken:badInput     - casename empty/wrong type, or a bad option value.
%   runKraken:noEnv        - casename.env not found in pwd.
%   runKraken:noFlp        - casename.flp not found in pwd.
%   runKraken:validation   - validate_kraken_files returned false.
%   runKraken:noBinary     - which('kraken.exe'/'krakenc.exe'/'field.exe') failed.
%   runKraken:noOutput     - expected .mod missing after the modes stage.
%
% EXAMPLE
%   cd /path/to/case               % directory containing MunkK.env + MunkK.flp
%   validate_kraken_files( 'MunkK' );
%   run_kraken( 'MunkK' );
%   run_kraken( 'pekeris', 'Complex', true, 'PlotModes', true );
%
% SEE ALSO
%   validate_kraken_files, kraken, krakenc, field, read_shd, plotshd, plotmode

    % ---- documented defaults (no bare magic numbers) -----------------------
    DEF.atRoot      = '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4';
    DEF.tlFloor     = 1e-37;          % abs(pressure) below this is floored before log10
    DEF.krakenBin   = 'kraken.exe';   % literal name resolved via which() on Linux too
    DEF.krakencBin  = 'krakenc.exe';  % complex-mode solver
    DEF.fieldBin    = 'field.exe';    % only needed if running the Fortran field

    % ---- parse inputs ------------------------------------------------------
    if ( nargin < 1 || isempty( casename ) || ~( ischar( casename ) || isstring( casename ) ) )
        error( 'runKraken:badInput', ...
            'casename must be a non-empty char/string giving the case name WITHOUT extension.' );
    end
    casename = char( casename );
    % Strip a stray .env/.flp if the caller included it (the wrappers want no ext).
    [ cp, cn, ce ] = fileparts( casename );
    if ( strcmpi( ce, '.env' ) || strcmpi( ce, '.flp' ) )
        casename = fullfile( cp, cn );
    end

    opt = local_parse_opts( varargin, DEF );

    % ---- pick the modes solver --------------------------------------------
    if ( opt.Complex )
        modeBin  = DEF.krakencBin;
        modeFun  = @krakenc;
        modeName = 'krakenc';
    else
        modeBin  = DEF.krakenBin;
        modeFun  = @kraken;
        modeName = 'kraken';
    end

    % ---- ensure the AT path is set up so binaries/scripts resolve ----------
    local_ensure_path( opt.AtRoot, modeBin );

    % ---- both input files must exist before doing anything expensive -------
    envfile = [ casename '.env' ];
    flpfile = [ casename '.flp' ];
    if ( exist( envfile, 'file' ) ~= 2 )
        error( 'runKraken:noEnv', ...
            [ 'Environment file "%s" not found in the current directory (%s).\n', ...
              'cd into the directory that contains %s before calling run_kraken.' ], ...
            envfile, pwd, envfile );
    end
    if ( exist( flpfile, 'file' ) ~= 2 )
        error( 'runKraken:noFlp', ...
            [ 'Field-parameters file "%s" not found in the current directory (%s).\n', ...
              'KRAKEN needs both %s.env (modes) and %s.flp (field); create the .flp first.' ], ...
            flpfile, pwd, casename, casename );
    end

    % ---- validate BOTH files before running -------------------------------
    if ( opt.Validate )
        ok = validate_kraken_files( casename );
        if ( ~ok )
            error( 'runKraken:validation', ...
                [ 'validate_kraken_files reported FAIL for "%s". The run was aborted.\n', ...
                  'Fix the FAIL items listed above and re-run. (Pass ''Validate'',false to override,\n', ...
                  'but this is not recommended.)' ], casename );
        end
    end

    % ---- confirm the binaries actually resolve -----------------------------
    binPath = which( modeBin );
    if ( isempty( binPath ) )
        error( 'runKraken:noBinary', ...
            [ '%s not found on the MATLAB path even after addpath.\n', ...
              'Check that %s exists and is executable (chmod +x).' ], ...
            modeBin, fullfile( opt.AtRoot, 'linux-bin', modeBin ) );
    end
    fprintf( 'Using KRAKEN modes binary: %s\n', binPath );

    % ---- clear stale outputs so a failed run cannot be mis-plotted ---------
    % The wrappers overwrite on success, but a run that aborts leaves the
    % previous .mod/.shd/.prt in place and the plotter would draw a stale field.
    for ext = { '.mod', '.shd', '.shd.mat', '.prt' }
        stale = [ casename ext{1} ];
        if ( exist( stale, 'file' ) )
            delete( stale );
        end
    end

    % ---- run KRAKEN (computes modes; the AT wrapper calls field internally)-
    fprintf( 'Running %s( ''%s'' ) ...\n', modeName, casename );
    modeFun( casename );

    % ---- the modes stage must have produced a .mod -------------------------
    modfile = [ casename '.mod' ];
    if ( exist( modfile, 'file' ) ~= 2 )
        error( 'runKraken:noOutput', ...
            [ 'No mode file "%s" was produced by %s. The modes stage failed.\n', ...
              'Inspect "%s.prt" for the KRAKEN error log.' ], ...
            modfile, modeName, casename );
    end

    % ---- plot the transmission-loss field ----------------------------------
    local_plot_tl( casename, opt, DEF );

    % ---- optionally plot the mode shapes -----------------------------------
    if ( opt.PlotModes )
        local_plot_modes( casename, opt );
    end
end

% ========================================================================
% Local helper functions
% ========================================================================

function opt = local_parse_opts( args, DEF )
% LOCAL_PARSE_OPTS  Parse Name-Value pairs into a validated options struct.
    opt.AtRoot    = DEF.atRoot;
    opt.Complex   = false;
    opt.PlotModes = false;
    opt.Freq      = NaN;
    opt.Validate  = true;

    if ( mod( numel( args ), 2 ) ~= 0 )
        error( 'runKraken:badInput', ...
            'Optional arguments must be Name-Value pairs; got an odd number of extra args.' );
    end
    for ii = 1 : 2 : numel( args )
        name = args{ ii };
        val  = args{ ii + 1 };
        if ( ~( ischar( name ) || isstring( name ) ) )
            error( 'runKraken:badInput', 'Option names must be strings.' );
        end
        switch lower( char( name ) )
            case 'atroot'
                if ( ~( ischar( val ) || isstring( val ) ) )
                    error( 'runKraken:badInput', '''AtRoot'' must be a path string.' );
                end
                opt.AtRoot = char( val );
            case 'complex'
                if ( ~( islogical( val ) && isscalar( val ) ) )
                    error( 'runKraken:badInput', '''Complex'' must be a logical scalar (true/false).' );
                end
                opt.Complex = val;
            case 'plotmodes'
                if ( ~( islogical( val ) && isscalar( val ) ) )
                    error( 'runKraken:badInput', '''PlotModes'' must be a logical scalar (true/false).' );
                end
                opt.PlotModes = val;
            case 'freq'
                if ( ~( isnumeric( val ) && isscalar( val ) ) )
                    error( 'runKraken:badInput', '''Freq'' must be a numeric scalar (Hz).' );
                end
                opt.Freq = val;
            case 'validate'
                if ( ~( islogical( val ) && isscalar( val ) ) )
                    error( 'runKraken:badInput', '''Validate'' must be a logical scalar (true/false).' );
                end
                opt.Validate = val;
            otherwise
                error( 'runKraken:badInput', 'Unknown option ''%s''.', char( name ) );
        end
    end
end

function local_ensure_path( atRoot, binName )
% LOCAL_ENSURE_PATH  Put the AT Matlab tree (recursively) and linux-bin on path.
%   genpath is required because field.m lives in Matlab/Kraken/, the readers in
%   Matlab/ReadWrite/, and the plotters in Matlab/Plot/ -- not in Matlab/ root.
    if ( exist( atRoot, 'dir' ) ~= 7 )
        error( 'runKraken:noBinary', ...
            'AT root directory does not exist: %s. Pass a valid ''AtRoot''.', atRoot );
    end
    matlabDir = fullfile( atRoot, 'Matlab' );
    binDir    = fullfile( atRoot, 'linux-bin' );

    if ( exist( matlabDir, 'dir' ) == 7 )
        addpath( genpath( matlabDir ) );
    else
        warning( 'runKraken:noBinary', 'AT Matlab directory not found: %s', matlabDir );
    end
    if ( exist( binDir, 'dir' ) == 7 )
        addpath( binDir );
    else
        error( 'runKraken:noBinary', ...
            'AT linux-bin directory not found: %s (needed so which(''%s'') resolves).', binDir, binName );
    end
end

function local_plot_tl( casename, opt, DEF )
% LOCAL_PLOT_TL  Read the .shd field and draw a transmission-loss surface.
%   Conventions: depth axis increases downward, range axis in km, TL in dB,
%   reversed colormap, title = casename. The MATLAB field.m saves
%   casename.shd.mat; the Fortran field.exe writes casename.shd. Prefer whichever
%   exists. Points the user to the .prt file if neither is present or usable.
    shdMat = [ casename '.shd.mat' ];
    shdBin = [ casename '.shd' ];
    if ( exist( shdMat, 'file' ) == 2 )
        shdfile = shdMat;
    elseif ( exist( shdBin, 'file' ) == 2 )
        shdfile = shdBin;
    else
        fprintf( 2, [ 'No shade file ("%s" or "%s") was produced; the field stage wrote no field.\n', ...
                      'Inspect "%s.prt" for KRAKEN/field warnings.\n' ], ...
                 shdMat, shdBin, casename );
        return;
    end

    if ( isnan( opt.Freq ) )
        [ ~, ~, ~, ~, ~, Pos, pressure ] = read_shd( shdfile );
    else
        [ ~, ~, ~, ~, ~, Pos, pressure ] = read_shd( shdfile, opt.Freq );
    end

    if ( isempty( pressure ) || all( abs( pressure(:) ) == 0 ) )
        fprintf( 2, [ 'Shade file "%s" is empty or all-zero (no field computed).\n', ...
                      'Check "%s.prt": verify cLow/cHigh span the water-to-bottom speeds\n', ...
                      '(modes outside the window are dropped) and that modes were found.\n' ], ...
                 shdfile, casename );
        return;
    end

    % pressure is p( Nfreq, Ntheta, Nsd, Nrd, Nrr ) (read_shd) or, for field.m's
    % .shd.mat, p( Nfreq, Nsd, Nrd, Nrr ). Squeeze to the trailing Nrd x Nrr.
    sz   = size( pressure );
    p2d  = squeeze( pressure );
    if ( ~ismatrix( p2d ) )
        % Collapse to the last two axes (receiver depth x receiver range).
        p2d = reshape( p2d, sz( end - 1 ), sz( end ) );
    end

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

function local_plot_modes( casename, opt )
% LOCAL_PLOT_MODES  Plot mode shapes and wavenumbers from the .mod file.
%   plotmode appends .mod automatically and uses the global units/jkpsflag; set
%   them to sane defaults so it does not warn about empty globals.
    modfile = [ casename '.mod' ];
    if ( exist( modfile, 'file' ) ~= 2 )
        fprintf( 2, [ 'PlotModes requested but no mode file "%s" was produced.\n', ...
                      'Check "%s.prt" for the KRAKEN modes log.\n' ], modfile, casename );
        return;
    end
    global units jkpsflag %#ok<GVMIS>
    if ( isempty( units ) );    units = 'km';   end
    if ( isempty( jkpsflag ) ); jkpsflag = 0;   end
    % plotmode requires a frequency argument (calling it with one arg leaves
    % its internal 'freq' undefined). Use 0 to select the single-frequency set.
    if ( isnan( opt.Freq ) )
        plotmode( casename, 0 );
    else
        plotmode( casename, opt.Freq );
    end
end
