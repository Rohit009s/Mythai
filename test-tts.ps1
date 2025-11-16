$headers = @{'Content-Type'='application/json'}

Write-Host "🎤 Testing ElevenLabs TTS Integration`n"

# 1. Create conversation
Write-Host "1️⃣  Creating conversation..."
try {
  $convRes = Invoke-WebRequest -Uri "http://localhost:3000/api/conversations" -Method POST -Headers $headers -Body "{}"
  $conv = $convRes.Content | ConvertFrom-Json
  $conversationId = $conv.conversationId
  Write-Host "   ✅ Conversation: $conversationId`n"
} catch {
  Write-Host "   ❌ Failed: $($_.Exception.Message)`n"
  exit 1
}

# 2. Get available voices
Write-Host "2️⃣  Fetching available voices..."
try {
  $voicesRes = Invoke-WebRequest -Uri "http://localhost:3000/api/voices" -Method GET -Headers $headers
  $voices = $voicesRes.Content | ConvertFrom-Json
  Write-Host "   ✅ Available voices: $($voices.voices.Length)"
  $voices.voices | Select-Object -First 3 | ForEach-Object {
    Write-Host "      • $($_.name) ($($_.voice_id))"
  }
  Write-Host ""
} catch {
  Write-Host "   ⚠️  Could not fetch voices (may be demo mode): $($_.Exception.Message)`n"
}

# 3. Send message WITHOUT audio
Write-Host "3️⃣  Sending message WITHOUT audio..."
try {
  $body = @{
    conversationId = $conversationId
    persona = 'krishna'
    text = 'What is dharma?'
    audio = $false
  } | ConvertTo-Json

  $noAudioRes = Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -Headers $headers -Body $body
  $reply = $noAudioRes.Content | ConvertFrom-Json
  Write-Host "   ✅ Reply: `"$($reply.reply.text.Substring(0, [Math]::Min(60, $reply.reply.text.Length)))...`""
  Write-Host "   Audio status: $($reply.reply.audioStatus)"
  Write-Host "   Audio URL: $(if ($reply.reply.audioUrl) { 'Generated' } else { 'None' })`n"
} catch {
  Write-Host "   ❌ Failed: $($_.Exception.Message)`n"
  exit 1
}

# 4. Send message WITH audio
Write-Host "4️⃣  Sending message WITH audio..."
try {
  $body = @{
    conversationId = $conversationId
    persona = 'shiva'
    text = 'Tell me about meditation.'
    audio = $true
  } | ConvertTo-Json

  $audioRes = Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -Headers $headers -Body $body
  $reply = $audioRes.Content | ConvertFrom-Json
  Write-Host "   ✅ Reply: `"$($reply.reply.text.Substring(0, [Math]::Min(60, $reply.reply.text.Length)))...`""
  Write-Host "   Audio status: $($reply.reply.audioStatus)"
  Write-Host "   Audio URL: $(if ($reply.reply.audioUrl) { 'Generated (' + $reply.reply.audioUrl.Substring(0, 40) + '...)' } else { 'None' })`n"
} catch {
  Write-Host "   ❌ Failed: $($_.Exception.Message)`n"
  exit 1
}

# 5. Fetch conversation history
Write-Host "5️⃣  Fetching conversation history..."
try {
  $historyRes = Invoke-WebRequest -Uri "http://localhost:3000/api/conversations/$conversationId" -Method GET -Headers $headers
  $history = $historyRes.Content | ConvertFrom-Json
  Write-Host "   ✅ Total messages: $($history.messages.Length)"
  $history.messages | ForEach-Object -Begin {$idx=1} {
    $text = $_.text -replace "`n", " "
    $preview = if ($text.Length -gt 50) { $text.Substring(0, 50) + "..." } else { $text }
    Write-Host "      $idx. [$($_.sender)] $preview"
    if ($_.audioStatus) {
      Write-Host "         Audio: $($_.audioStatus)"
    }
    $idx++
  }
  Write-Host ""
} catch {
  Write-Host "   ❌ Failed: $($_.Exception.Message)`n"
  exit 1
}

Write-Host "✨ All TTS tests passed!`n"
