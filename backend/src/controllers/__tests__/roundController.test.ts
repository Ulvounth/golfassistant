import { calculateScoreDifferential } from '../roundController';

describe('calculateScoreDifferential', () => {
  it('should calculate correct score differential for 18 holes', () => {
    // Arrange
    const totalScore = 85;
    const courseRating = 72.0;
    const slopeRating = 113;
    const numberOfHoles = 18;

    // Act
    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating, numberOfHoles);

    // Assert
    expect(result).toBe(13.0);
  });

  it('should handle 9-hole rounds correctly (WHS: double score and rating)', () => {
    // For a 9-hole round: score 42, rating 36.0 (for 9 holes)
    // WHS formula: (score*2 - rating*2) * 113 / slope
    // (42*2 - 36*2) * 113 / 113 = (84 - 72) * 113 / 113 = 12
    const totalScore = 42; // 9-hole score
    const courseRating = 36.0; // 9-hole rating (half of 72)
    const slopeRating = 113; // Full slope (not halved per WHS)
    const numberOfHoles = 9;

    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating, numberOfHoles);

    expect(result).toBe(12.0);
  });

  it('should handle par rounds for 18 holes', () => {
    const totalScore = 72;
    const courseRating = 72.0;
    const slopeRating = 113;
    const numberOfHoles = 18;

    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating, numberOfHoles);

    expect(result).toBe(0);
  });

  it('should handle below-par rounds for 18 holes', () => {
    const totalScore = 68;
    const courseRating = 72.0;
    const slopeRating = 113;
    const numberOfHoles = 18;

    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating, numberOfHoles);

    expect(result).toBe(-4.0);
  });

  it('should handle 9-hole rounds at par', () => {
    const totalScore = 36; // Par for 9 holes
    const courseRating = 36.0; // 9-hole rating
    const slopeRating = 113;
    const numberOfHoles = 9;

    // (36*2 - 36*2) * 113 / 113 = 0
    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating, numberOfHoles);

    expect(result).toBe(0);
  });
});
