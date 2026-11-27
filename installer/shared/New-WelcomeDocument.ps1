# Creates "Welcome to JBC Speech.docx": a tiny Word document that references the add-in.
# Registering the manifest under WEF\Developer only makes Word *list* the add-in (Home > Add-ins >
# My Add-ins > Developer Add-ins). Opening a document that references it adds it, which puts the
# JBC Speech tab on the ribbon. This is what `npm run sideload` does with its template document.
# Keep this file ASCII-only: Windows PowerShell 5.1 misreads UTF-8 without a BOM.
function New-WelcomeDocument {
    param([Parameter(Mandatory)] [string] $Path, [Parameter(Mandatory)] [string] $AddinId, [Parameter(Mandatory)] [string] $Version)
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    $para = { param($text, $bold, $size) "<w:p><w:r><w:rPr>$(if ($bold) { '<w:b/>' })<w:sz w:val=`"$size`"/></w:rPr><w:t xml:space=`"preserve`">$text</w:t></w:r></w:p>" }
    $body = @(
        (& $para 'JBC Speech is ready.' $true 40),
        (& $para 'The JBC Speech tab is now on the Word ribbon. Click IPA Library to show or hide the symbol library.' $false 24),
        (& $para 'Click in any document, then click a symbol to insert it. Shift-click a symbol to hear it.' $false 24),
        (& $para 'You can close this document without saving. If the tab ever goes missing, open this document again from the Start menu.' $false 24)
    ) -join ''
    $parts = [ordered]@{
        '[Content_Types].xml' = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/webextensions/taskpanes.xml" ContentType="application/vnd.ms-office.webextensiontaskpanes+xml"/><Override PartName="/word/webextensions/webextension.xml" ContentType="application/vnd.ms-office.webextension+xml"/></Types>'
        '_rels/.rels' = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml"/><Relationship Id="rPanes" Type="http://schemas.microsoft.com/office/2011/relationships/webextensiontaskpanes" Target="/word/webextensions/taskpanes.xml"/></Relationships>'
        'word/document.xml' = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><w:document xmlns:w=`"$w`"><w:body>$body<w:sectPr/></w:body></w:document>"
        'word/webextensions/taskpanes.xml' = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><wetp:taskpanes xmlns:wetp="http://schemas.microsoft.com/office/webextensions/taskpanes/2010/11" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><wetp:taskpane dockstate="right" visibility="1" width="350" row="1"><wetp:webextensionref r:id="rExt"/></wetp:taskpane></wetp:taskpanes>'
        'word/webextensions/_rels/taskpanes.xml.rels' = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rExt" Type="http://schemas.microsoft.com/office/2011/relationships/webextension" Target="/word/webextensions/webextension.xml"/></Relationships>'
        'word/webextensions/webextension.xml' = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><we:webextension xmlns:we=`"http://schemas.microsoft.com/office/webextensions/webextension/2010/11`" id=`"{$AddinId}`"><we:reference id=`"$AddinId`" version=`"$Version`" store=`"developer`" storeType=`"Registry`"/><we:alternateReferences/><we:properties/><we:bindings/></we:webextension>"
    }
    if (Test-Path $Path) { Remove-Item $Path -Force }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $zip = [System.IO.Compression.ZipFile]::Open($Path, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($name in $parts.Keys) {
            $writer = New-Object System.IO.StreamWriter($zip.CreateEntry($name).Open(), $utf8)
            try { $writer.Write($parts[$name]) } finally { $writer.Dispose() }
        }
    } finally { $zip.Dispose() }
}
