#!/usr/bin/env node

/**
 * Cross-platform release build script for Noro extension
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    log(`❌ ERROR: ${message}`, 'red');
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function info(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Get the extension directory (parent of scripts directory)
const extensionDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(extensionDir, '..');

// Required files and directories for the release
const filesToInclude = [
    'dist',
    'manifest.json',
    'popup.html',
    'history.html',
    'public'
];

// Files and directories to exclude
const excludePatterns = [
    'node_modules',
    'src',
    '*.ts',
    '*.tsx',
    '.git',
    '.gitignore',
    'tsconfig.json',
    'package.json',
    'package-lock.json',
    'scripts'
];

function checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.split('.')[0].substring(1));
    if (major < 14) {
        error('Node.js version 14 or higher is required');
        process.exit(1);
    }
    success(`Node.js version: ${version}`);
}

function checkConfigExists() {
    const configPath = path.join(extensionDir, 'src', 'config.ts');
    if (!fs.existsSync(configPath)) {
        error('config.ts not found!');
        console.log('');
        info('Please create config.ts from config.template.ts:');
        console.log('  1. cd extension/src');
        console.log('  2. cp config.template.ts config.ts');
        console.log('  3. Edit config.ts with your AWS credentials');
        process.exit(1);
    }
    success('config.ts found');
}

function runBuild() {
    info('Building TypeScript...');
    try {
        execSync('npm run build', { cwd: extensionDir, stdio: 'inherit' });
        success('Build completed');
    } catch (err) {
        error('Build failed');
        process.exit(1);
    }
}

function checkDistExists() {
    const distPath = path.join(extensionDir, 'dist');
    if (!fs.existsSync(distPath)) {
        error('dist directory not found after build');
        process.exit(1);
    }
    success('dist directory exists');
}

function copyDirectory(src, dest, excludePatterns = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        // Check if this entry should be excluded
        const shouldExclude = excludePatterns.some(pattern => {
            if (pattern.startsWith('*.')) {
                // File extension pattern
                return entry.name.endsWith(pattern.substring(1));
            } else {
                // Exact name match
                return entry.name === pattern;
            }
        });

        if (shouldExclude) {
            continue;
        }

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, excludePatterns);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function createReleasePackage() {
    info('Creating release package...');

    const releaseDir = path.join(extensionDir, 'release-temp');
    const releaseName = 'noro-extension-release';
    const releaseZip = path.join(extensionDir, `${releaseName}.zip`);

    // Clean up old release directory and zip
    if (fs.existsSync(releaseDir)) {
        fs.rmSync(releaseDir, { recursive: true, force: true });
    }
    if (fs.existsSync(releaseZip)) {
        fs.unlinkSync(releaseZip);
        info('Removed old release zip');
    }

    // Create release directory
    fs.mkdirSync(releaseDir, { recursive: true });

    // Copy required files
    for (const item of filesToInclude) {
        const srcPath = path.join(extensionDir, item);
        const destPath = path.join(releaseDir, item);

        if (!fs.existsSync(srcPath)) {
            warning(`Skipping ${item} (not found)`);
            continue;
        }

        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            info(`Copying directory: ${item}`);
            copyDirectory(srcPath, destPath, excludePatterns);
        } else {
            info(`Copying file: ${item}`);
            fs.copyFileSync(srcPath, destPath);
        }
    }

    success('Files copied to release directory');

    // Create ZIP file
    info('Creating ZIP archive...');
    try {
        // Use archiver for cross-platform ZIP creation
        const archiver = require('archiver');
        const output = fs.createWriteStream(releaseZip);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            success(`Release package created: ${releaseName}.zip (${sizeInMB} MB)`);
            
            // Clean up temp directory
            fs.rmSync(releaseDir, { recursive: true, force: true });
            
            console.log('');
            success('🎉 Release build completed successfully!');
            console.log('');
            info(`Release file: ${path.relative(rootDir, releaseZip)}`);
            console.log('');
            info('Next steps:');
            console.log('  1. Test the extension by loading it in Chrome');
            console.log('  2. Upload the ZIP file to GitHub releases');
            console.log('  3. Share with users!');
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(releaseDir, false);
        archive.finalize();

    } catch (err) {
        error(`Failed to create ZIP: ${err.message}`);
        
        // Fallback: try to use system zip command
        info('Trying system zip command as fallback...');
        try {
            const isWindows = process.platform === 'win32';
            
            if (isWindows) {
                // PowerShell on Windows
                const powershellCmd = `Compress-Archive -Path "${releaseDir}\\*" -DestinationPath "${releaseZip}" -Force`;
                execSync(`powershell -Command "${powershellCmd}"`, { stdio: 'inherit' });
            } else {
                // zip command on Unix-like systems
                execSync(`cd "${releaseDir}" && zip -r "${releaseZip}" .`, { stdio: 'inherit' });
            }
            
            success(`Release package created: ${releaseName}.zip`);
            
            // Clean up temp directory
            fs.rmSync(releaseDir, { recursive: true, force: true });
            
            console.log('');
            success('🎉 Release build completed successfully!');
            console.log('');
            info(`Release file: ${path.relative(rootDir, releaseZip)}`);
        } catch (zipErr) {
            error('Failed to create ZIP with system command');
            console.log('');
            warning('Manual steps to create release:');
            console.log(`  1. The files are ready in: ${releaseDir}`);
            console.log(`  2. Manually ZIP the contents of that directory`);
            console.log(`  3. Name it: ${releaseName}.zip`);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    console.log('');
    log('╔════════════════════════════════════════════╗', 'blue');
    log('║   Noro Extension - Release Build Script   ║', 'blue');
    log('╚════════════════════════════════════════════╝', 'blue');
    console.log('');

    // Check environment
    checkNodeVersion();
    checkConfigExists();

    console.log('');

    // Build the extension
    runBuild();

    console.log('');

    // Verify build output
    checkDistExists();

    console.log('');

    // Create release package
    createReleasePackage();
}

// Run the script
main().catch(err => {
    console.error('');
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
});
