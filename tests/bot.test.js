const { getBotReply, helpMessage, isValidUserMessage } = require('../src/bot');

describe('bot logic', () => {
  test('responds to greeting keywords', () => {
    expect(getBotReply('hello')).toMatch(/Hello/i);
    expect(getBotReply('halo')).toMatch(/Halo/i);
  });

  test('handles time queries', () => {
    const r = getBotReply('what time is it?');
    expect(r).toMatch(/current time/i);
  });

  test('handles math calculations', () => {
    expect(getBotReply('hitung 5+5')).toContain('10');
    expect(getBotReply('calc 100/4')).toContain('25');
    // invalid chars
    expect(getBotReply('hitung 5a+5')).toContain('Maaf, saya hanya bisa menghitung angka');
    // syntax error
    expect(getBotReply('calc 5++')).toContain('Maaf, saya hanya bisa menghitung angka');
  });

  test('returns fallback on unknown', () => {
    expect(getBotReply('qwerty')).toContain("Maaf, saya belum mengerti");
  });

  test('validates messages', () => {
    expect(isValidUserMessage(null)).toBeFalsy();
    expect(isValidUserMessage('   ')).toBeFalsy();
    expect(isValidUserMessage('hi')).toBeTruthy();
    const long = 'x'.repeat(1001);
    expect(isValidUserMessage(long)).toBeFalsy();
  });

  test('does not trigger bot reply on substring false-positive', () => {
    // 'hi' is a keyword but 'Khidmat' should NOT trigger it (word boundary guard)
    const reply = getBotReply('Khidmat');
    expect(reply).toContain('Maaf, saya belum mengerti');
  });

  test('returns help text for /help and !help commands', () => {
    expect(getBotReply('/help')).toBe(helpMessage);
    expect(getBotReply('!help')).toBe(helpMessage);
    expect(getBotReply('help')).toBe(helpMessage);
  });

  test('getBotReply returns a non-empty string for any input', () => {
    const inputs = ['hello', 'bye', 'terima kasih', 'joke', 'random xyz'];
    inputs.forEach((input) => {
      const reply = getBotReply(input);
      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });
  });
});
