import AnalyzeService from "../../../webview/service/analyzeService";

describe("analyzeService", () => {
  test("roundToNearestNiceNumber", () => {
    const inputs: number[] = [
      -5, 0, 0.0011, 0.061, 0.084, 0.12, 0.19, 0.38, 0.85, 1.12, 9.3, 10.5, 265,
      6890,
    ];
    const expNice: number[] = [
      0, 0, 0.001, 0.05, 0.1, 0.1, 0.2, 0.5, 1.0, 1.0, 10, 10, 200, 5000,
    ];
    const expDigs: number[] = [0, 0, 3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0];

    for (let i = 0; i < inputs.length; i++) {
      const [nice, dig]: [number, number] =
        AnalyzeService.roundToNearestNiceNumber(inputs[i]);
      expect(nice).toBe(expNice[i]);
      expect(dig).toBe(expDigs[i]);
    }
  });
});
