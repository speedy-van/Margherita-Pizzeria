Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$path = "C:\MARGHERITA\public\logo.png"
$tmp = "C:\MARGHERITA\public\logo.tmp.png"
$bytesIn = [System.IO.File]::ReadAllBytes($path)
$ms = New-Object System.IO.MemoryStream(,$bytesIn)
$srcOrig = [System.Drawing.Image]::FromStream($ms)
$src = New-Object System.Drawing.Bitmap $srcOrig.Width, $srcOrig.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfx = [System.Drawing.Graphics]::FromImage($src)
$gfx.DrawImage($srcOrig, 0, 0, $srcOrig.Width, $srcOrig.Height)
$gfx.Dispose()
$srcOrig.Dispose()
$ms.Dispose()
$w = $src.Width; $h = $src.Height
$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$thr = 80
for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
        $i = $row + $x * 4
        $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
        if ($r -lt $thr -and $g -lt $thr -and $b -lt $thr) {
            $bytes[$i] = 0; $bytes[$i + 1] = 0; $bytes[$i + 2] = 0; $bytes[$i + 3] = 255
        }
    }
}
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$src.UnlockBits($data)
$src.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
Move-Item -Force $tmp $path
Write-Host "done"

