import { MockAudioBuffer } from "../../__mocks__/helper";
import AnalyzeService from "./analyzeService";

describe("analyzeService", () => {
  test("roundToNearestNiceNumber", () => {
    const examples = [
      { input: -5, expNice: 0, expDigs: 0 },
      { input: 0, expNice: 0, expDigs: 0 },
      { input: 0.0011, expNice: 0.001, expDigs: 3 },
      { input: 0.061, expNice: 0.05, expDigs: 2 },
      { input: 0.084, expNice: 0.1, expDigs: 1 },
      { input: 0.12, expNice: 0.1, expDigs: 1 },
      { input: 0.19, expNice: 0.2, expDigs: 1 },
      { input: 0.38, expNice: 0.5, expDigs: 1 },
      { input: 0.85, expNice: 1.0, expDigs: 0 },
      { input: 1.12, expNice: 1.0, expDigs: 0 },
      { input: 9.3, expNice: 10, expDigs: 0 },
      { input: 10.5, expNice: 10, expDigs: 0 },
      { input: 265, expNice: 200, expDigs: 0 },
      { input: 6890, expNice: 5000, expDigs: 0 },
    ];

    for (const example of examples) {
      const [nice, dig] = AnalyzeService.roundToNearestNiceNumber(
        example.input,
      );
      expect(nice).toBe(example.expNice);
      expect(dig).toBe(example.expDigs);
    }
  });

  test("ANALYZE event should be dispatched", () => {
    const audioBuffer = new MockAudioBuffer(
      1,
      44100,
      44100,
    ) as unknown as AudioBuffer;
    const analyzeService = new AnalyzeService(audioBuffer);
    const spy = jest.spyOn(analyzeService, "dispatchEvent");
    analyzeService.analyze();
    expect(spy).toHaveBeenCalledWith(new CustomEvent("ANALYZE"));
    spy.mockReset();
    spy.mockRestore();
  });
});
