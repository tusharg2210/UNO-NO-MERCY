/**
 * Generate a random room code
 * @param {number} length - Length of the room code (default: 6)
 * @returns {string} Uppercase alphanumeric room code
 */
export function generateRoomCode(length = 6) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export default generateRoomCode;