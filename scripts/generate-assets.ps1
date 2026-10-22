Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\Charith\.gemini\antigravity-ide\brain\3de066e2-1be6-4a46-b44f-49d1b606ac39\.user_uploaded\media_1792633633682.jpg'
$publicDir = 'c:\Users\Charith\OneDrive\Desktop\1 DEPLOY\th3ee-deploy\public'

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($img, [int]$w, [int]$h, [string]$outPath) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $destImg = New-Object System.Drawing.Bitmap($w, $h)
    $destImg.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
    $g = [System.Drawing.Graphics]::FromImage($destImg)
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $g.DrawImage($img, $destRect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)
    $g.Dispose()
    $destImg.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImg.Dispose()
    Write-Host "Generated: $outPath ($w x $h)"
}

# Generate PNGs
Resize-Image $srcImg 1024 1024 "$publicDir\logo.png"
Resize-Image $srcImg 512 512 "$publicDir\logo-512.png"
Resize-Image $srcImg 512 512 "$publicDir\android-chrome-512x512.png"
Resize-Image $srcImg 192 192 "$publicDir\android-chrome-192x192.png"
Resize-Image $srcImg 180 180 "$publicDir\apple-touch-icon.png"
Resize-Image $srcImg 96 96 "$publicDir\favicon-96x96.png"
Resize-Image $srcImg 48 48 "$publicDir\favicon-48x48.png"
Resize-Image $srcImg 32 32 "$publicDir\favicon-32x32.png"
Resize-Image $srcImg 16 16 "$publicDir\favicon-16x16.png"

# Generate 1200x630 OG Banner (centered logo on matching brand red background)
$ogBmp = New-Object System.Drawing.Bitmap(1200, 630)
$ogG = [System.Drawing.Graphics]::FromImage($ogBmp)
$sampleBmp = New-Object System.Drawing.Bitmap($srcPath)
$cornerPixel = $sampleBmp.GetPixel(10, 10)
$sampleBmp.Dispose()
$bgBrush = New-Object System.Drawing.SolidBrush($cornerPixel)
$ogG.FillRectangle($bgBrush, 0, 0, 1200, 630)
$ogG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ogG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$logoSize = 550
$logoX = [int]((1200 - $logoSize) / 2)
$logoY = [int]((630 - $logoSize) / 2)
$ogG.DrawImage($srcImg, $logoX, $logoY, $logoSize, $logoSize)
$ogG.Dispose()
$ogBmp.Save("$publicDir\og-image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$ogBmp.Dispose()
Write-Host "Generated: $publicDir\og-image.png (1200x630 OG banner)"

$srcImg.Dispose()
