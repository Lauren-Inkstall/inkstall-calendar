export const POINTS = {
  DAILY_UPDATE: 30,
  K_SHEET: 100,
  // Test points are calculated dynamically based on marks
};

/**
 * Calculate points for test submission based on marks
 * @param {number} marks - Test marks (20-140)
 * @returns {number} - Points awarded (max 500)
 */
export const calculateTestPoints = (marks) => {
  // Validate marks range
  if (marks < 20) marks = 20;
  if (marks > 140) marks = 140;
  
  // Normalize marks to 0-1 range
  const normalizedMarks = (marks - 20) / (140 - 20);
  
  let points;
  if (normalizedMarks <= 0.5) {
    // For marks <= 80: Points = 100 + 300 * (normalized_marks^1.5)
    points = 100 + 300 * Math.pow(normalizedMarks, 1.5);
  } else {
    // For marks > 80: Points = 400 + 100 * ((normalized_marks - 0.5)^2)
    points = 400 + 100 * Math.pow(normalizedMarks - 0.5, 2);
  }
  
  // Round to nearest integer and cap at 500
  return Math.min(Math.round(points), 500);
};
