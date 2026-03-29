# download-images.ps1
# Downloads all lh3.googleusercontent.com images used in HTML/CSS/JS files,
# saves them to /assets/images/, and rewrites matching URLs in-place.

$rootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$imgDir  = Join-Path $rootDir "assets\images"

if (-not (Test-Path $imgDir)) {
    New-Item -ItemType Directory -Path $imgDir | Out-Null
    Write-Host "Created: assets/images/"
}

# Collect all scan targets
$scanFiles = Get-ChildItem -Recurse -File $rootDir |
    Where-Object { $_.Extension -in @(".html", ".css", ".js") }

# Track URL -> relative-path mapping to avoid re-downloading duplicates
$urlMap = @{}

# Continue numbering from existing files to avoid overwriting on reruns
$existingImages = Get-ChildItem -Path $imgDir -Filter "img-*.jpg" -File -ErrorAction SilentlyContinue
$maxExistingIndex = 0

foreach ($img in $existingImages) {
    if ($img.BaseName -match '^img-(\d+)$') {
        $index = [int]$matches[1]
        if ($index -gt $maxExistingIndex) {
            $maxExistingIndex = $index
        }
    }
}

$counter = $maxExistingIndex + 1

foreach ($file in $scanFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $srcMatches = [regex]::Matches($content, 'src="(https://lh3\.googleusercontent\.com[^\"]+)"')
    $cssUrlMatches = [regex]::Matches($content, 'url\((["'']?)(https://lh3\.googleusercontent\.com[^)"'']+)\1\)')
    $quotedUrlMatches = [regex]::Matches($content, '["''`](https://lh3\.googleusercontent\.com[^"''`]+)["''`]')

    $urlsInFile = @()
    foreach ($m in $srcMatches) {
        $urlsInFile += $m.Groups[1].Value
    }
    foreach ($m in $cssUrlMatches) {
        $urlsInFile += $m.Groups[2].Value
    }
    foreach ($m in $quotedUrlMatches) {
        $urlsInFile += $m.Groups[1].Value
    }

    foreach ($url in ($urlsInFile | Select-Object -Unique)) {
        if (-not $urlMap.ContainsKey($url)) {
            do {
                $filename = "img-$($counter.ToString('D3')).jpg"
                $destPath = Join-Path $imgDir $filename
                $counter++
            } while (Test-Path $destPath)

            Write-Host "[$($counter - 1)] Downloading -> assets/images/$filename"
            try {
                Invoke-WebRequest -Uri $url -OutFile $destPath -UseBasicParsing -TimeoutSec 30
                $urlMap[$url] = "assets/images/$filename"
            } catch {
                Write-Warning "  FAILED: $($_.Exception.Message)"
            }
        }
    }
}

Write-Host "`n--- Rewriting files (.html, .css, .js) ---"

foreach ($file in $scanFiles) {
    $content  = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false

    foreach ($url in $urlMap.Keys) {
        if ($content.Contains($url)) {
            # Calculate depth of this file relative to root
            $fileRelPath = $file.FullName.Substring($rootDir.Length + 1)
            $depth       = ($fileRelPath.Split('\').Count - 1)
            $prefix      = "../" * $depth

            $localSrc = $prefix + $urlMap[$url].Replace('\', '/')
            $content  = $content.Replace($url, $localSrc)
            $modified = $true
        }
    }

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $relFile = $file.FullName.Substring($rootDir.Length + 1)
        Write-Host "  Updated: $relFile"
    }
}

Write-Host "`nDone. $($urlMap.Count) unique images downloaded and paths rewritten."
