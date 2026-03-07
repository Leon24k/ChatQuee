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
});
