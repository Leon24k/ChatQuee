const { getBotReply, isValidUserMessage } = require('../src/bot');

describe('bot logic', () => {
  test('responds to greeting keywords', () => {
    expect(getBotReply('hello')).toMatch(/Hello/i);
    expect(getBotReply('halo')).toMatch(/Halo/i);
  });

  test('handles time queries', () => {
    const r = getBotReply('what time is it?');
    expect(r).toMatch(/current time/i);
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

  test('getBotReply returns a non-empty string for any input', () => {
    const inputs = ['hello', 'bye', 'terima kasih', 'joke', 'random xyz'];
    inputs.forEach((input) => {
      const reply = getBotReply(input);
      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });
  });
});
