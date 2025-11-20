import { calculateScoreDifferential } from '../roundController';

describe('calculateScoreDifferential', () => {
  it('should calculate correct score differential', () => {
    // Arrange
    const totalScore = 85;
    const courseRating = 72.0;
    const slopeRating = 113;

    // Act
    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating);

    // Assert
    expect(result).toBe(13.0);
  });

  it('should handle 9-hole rounds', () => {
    const totalScore = 42;
    const courseRating = 36.0; // 72 / 2
    const slopeRating = 56.5; // 113 / 2

    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating);

    expect(result).toBeCloseTo(12.0, 1);
  });

  it('should handle par rounds', () => {
    const totalScore = 72;
    const courseRating = 72.0;
    const slopeRating = 113;

    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating);

    expect(result).toBe(0);
  });

  it('should handle below-par rounds', () => {
    const totalScore = 68;
    const courseRating = 72.0;
    const slopeRating = 113;

    const result = calculateScoreDifferential(totalScore, courseRating, slopeRating);

    expect(result).toBe(-4.0);
  });
});
