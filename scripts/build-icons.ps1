# Export Office-sized icons from the supplied logo's speech-bubble mark.
# The source logo is kept unchanged; this rectangle excludes the wordmark.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetDirectory = Join-Path $PSScriptRoot '../src/assets'
$source = [System.Drawing.Image]::FromFile((Join-Path $assetDirectory 'jbc_speech.png'))
try {
    $crop = New-Object System.Drawing.RectangleF(100, 125, 580, 600)
    foreach ($size in @(16, 32, 80)) {
        $bitmap = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $attributes = New-Object System.Drawing.Imaging.ImageAttributes
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
            $width = [int][Math]::Round($size * $crop.Width / $crop.Height)
            $destination = New-Object System.Drawing.Rectangle(([int](($size - $width) / 2)), 0, $width, $size)
            $graphics.DrawImage($source, $destination, $crop.X, $crop.Y, $crop.Width, $crop.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
            $bitmap.Save((Join-Path $assetDirectory "jbc-icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $attributes.Dispose()
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
} finally { $source.Dispose() }
