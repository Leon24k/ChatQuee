const { getBotReply, helpMessage, isValidUserMessage, evaluateMath } = require('../src/bot');

describe('bot logic', () => {
  test('responds to greeting keywords', () => {
    expect(getBotReply('hello')).toMatch(/Hello/i);
    expect(getBotReply('halo')).toMatch(/Halo/i);
  });

  test('handles time queries', () => {
    const r = getBotReply('what time is it?');
    expect(r).toMatch(/current time/i);
  });

  test('handles math calculations safely with mathjs', () => {
    expect(getBotReply('hitung 5+5')).toContain('10');
    expect(getBotReply('calc 100/4')).toContain('25');
    // invalid syntax
    expect(getBotReply('hitung 5a+5')).toContain('Maaf, saya hanya bisa menghitung angka');
    // syntax error
    expect(getBotReply('calc 5++')).toContain('Maaf, saya hanya bisa menghitung angka');
  });

  test('evaluateMath function works correctly', () => {
    expect(evaluateMath('2 + 2')).toBe(4);
    expect(evaluateMath('10 * 5')).toBe(50);
    expect(evaluateMath('100 / 4')).toBe(25);
    expect(evaluateMath('invalid')).toBeNull();
  });

  test('returns fallback on unknown', () => {
    expect(getBotReply('qwerty')).toContain('Maaf, saya belum mengerti');
  });

  test('handles non-string input safely', () => {
    expect(() => getBotReply(null)).not.toThrow();
    expect(getBotReply(null)).toContain('Maaf, saya belum mengerti');
    expect(() => getBotReply(123)).not.toThrow();
    expect(getBotReply(123)).toContain('Maaf, saya belum mengerti');
  });

  test('validates messages with XSS prevention', () => {
    expect(isValidUserMessage(null)).toBeFalsy();
    expect(isValidUserMessage('   ')).toBeFalsy();
    expect(isValidUserMessage('hi')).toBeTruthy();
    expect(isValidUserMessage('<script>alert(1)</script>')).toBeFalsy();
    expect(isValidUserMessage('test&query')).toBeFalsy();
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
