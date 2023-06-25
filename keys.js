const sodium = require('libsodium-wrappers');

(async () => {
  await sodium.ready;
  const { publicKey, privateKey } = sodium.crypto_box_keypair();

  const keyHex = Array.from(publicKey, byte => byte.toString(16).padStart(2, '0')).join('');
  const keyString = keyHex.padEnd(88, ' ');

  console.log('Key as string:', keyString);
})();

