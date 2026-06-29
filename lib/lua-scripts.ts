// CONSUME_AUDIO_SCRIPT
// KEYS[1] = audio:{id}
// ARGV[1] = session_token
// ARGV[2] = session_ttl_seconds (as string)
// ARGV[3] = audio_id
// ARGV[4] = chunk_count
// ARGV[5] = now_iso
// ARGV[6] = codec
export const CONSUME_AUDIO_SCRIPT = `
local status = redis.call('HGET', KEYS[1], 'status')
if not status then
  return cjson.encode({ error = 'AUDIO_NOT_FOUND' })
end
if status ~= 'pending' then
  return cjson.encode({ error = 'ALREADY_CONSUMED', status = status })
end

redis.call('HSET', KEYS[1], 'status', 'consumed')

local sessionKey = 'session:' .. ARGV[1]
redis.call('HSET', sessionKey,
  'audio_id', ARGV[3],
  'created_at', ARGV[5],
  'chunks_served', '0',
  'next_expected_chunk', '0',
  'chunk_count', ARGV[4],
  'codec', ARGV[6]
)
redis.call('EXPIRE', sessionKey, tonumber(ARGV[2]))

redis.call('SADD', KEYS[1] .. ':sessions', sessionKey)

return cjson.encode({ ok = true })
`;

// VALIDATE_CHUNK_SESSION_SCRIPT
// KEYS[1] = session:{token}
// ARGV[1] = audio_id
// ARGV[2] = requested_chunk_index (as string)
export const VALIDATE_CHUNK_SESSION_SCRIPT = `
local sessionData = redis.call('HGETALL', KEYS[1])
if #sessionData == 0 then
  return cjson.encode({ error = 'INVALID_SESSION' })
end

local session = {}
for i = 1, #sessionData, 2 do
  session[sessionData[i]] = sessionData[i+1]
end

if session['audio_id'] ~= ARGV[1] then
  return cjson.encode({ error = 'SESSION_AUDIO_MISMATCH' })
end

local expected = tonumber(session['next_expected_chunk'])
local requested = tonumber(ARGV[2])
local chunkCount = tonumber(session['chunk_count'])

if requested ~= expected then
  return cjson.encode({ error = 'OUT_OF_SEQUENCE', expected = expected })
end

if requested >= chunkCount then
  return cjson.encode({ error = 'INVALID_CHUNK_INDEX' })
end

redis.call('HSET', KEYS[1], 'next_expected_chunk', tostring(requested + 1))
redis.call('HSET', KEYS[1], 'chunks_served', tostring(requested + 1))

return cjson.encode({ ok = true, is_last = (requested + 1 == chunkCount), codec = session['codec'] })
`;
