const dns = require('dns').promises;
const net = require('net');

// Blocks SSRF: only allow public http(s) URLs, reject anything resolving to
// a private/loopback/link-local address.
function isPrivateIp(ip) {
  const type = net.isIP(ip);
  if (type === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    return false;
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('fe80')) return true; // link-local
    return false;
  }
  return true; // unknown format, treat as unsafe
}

async function assertSafePublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed');
  }
  if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.local')) {
    throw new Error('Local addresses are not allowed');
  }

  let addresses;
  try {
    addresses = await dns.lookup(parsed.hostname, { all: true });
  } catch {
    throw new Error('Could not resolve hostname');
  }
  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new Error('Target resolves to a private/internal address, which is not allowed');
    }
  }

  return parsed.toString();
}

module.exports = { assertSafePublicUrl, isPrivateIp };
