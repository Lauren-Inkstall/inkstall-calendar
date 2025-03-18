// File: src/components/TeacherPoints.js
import React, { useState, useEffect } from 'react';
import useTeacherPoints from '../hooks/useMyTeacherPoints';
import useAllTeacherPoints from '../hooks/useAllTeacherPoints';
import MainFrame from './ui/MainFrame';

const TeacherPoints = () => {
  const { points, loading, error } = useTeacherPoints();
  const { points: allTeacherPoints, loading: allLoading, error: allError } = useAllTeacherPoints();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (points && !loading) {
      setShowAnimation(true);
    }
  }, [points, loading]);

  if (loading || allLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || allError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || allError}</p>
        </div>
      </div>
    );
  }

  if (!points) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No activity data available yet!</p>
      </div>
    );
  }

  // Calculate level based on teacher's own total points (2000 XP per level)
  const level = Math.floor(points.totalPoints / 2000) + 1;
  const nextLevelPoints = level * 2000;
  const progressPercentage = (points.totalPoints % 2000) / 20;

  // Determine K-Sheet achievement level
  const getKSheetAchievementColor = () => {
    const kSheetCount = points.kSheetPoints / 100; // Assuming 100 XP per K-Sheet
    if (kSheetCount >= 100) return "bg-yellow-500"; // Gold
    if (kSheetCount >= 50) return "bg-gray-400"; // Silver
    if (kSheetCount >= 20) return "bg-amber-700"; // Bronze
    return "bg-gray-300"; // Not achieved
  };

  const getKSheetAchievementLabel = () => {
    const kSheetCount = points.kSheetPoints / 100;
    if (kSheetCount >= 100) return "Gold";
    if (kSheetCount >= 50) return "Silver";
    if (kSheetCount >= 20) return "Bronze";
    return "Not Achieved";
  };

  // Sort the all teacher points in descending order of totalPoints
  const sortedTeachers = [...allTeacherPoints].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <MainFrame>
      <div className="max-w-4xl mx-auto">
        <div 
          className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-t-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-12 -mb-12 bg-white/10 rounded-full"></div>
          
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold">Activity Points</h1>
              <p className="text-blue-100">{points.month} Progress</p>
            </div>
            <div 
              className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce"
            >
              <div className="text-center">
                <span className="block text-4xl font-black text-blue-900">Lvl</span>
                <span className="block text-4xl font-black text-blue-900">{level}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-b-2xl shadow-xl p-6">
          {/* Progress bar to next level */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                XP: {points.totalPoints}/{nextLevelPoints}
              </span>
              <span className="text-sm font-medium text-purple-600">
                Next Level: {level + 1}
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPercentage}%` }}
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000 ease-out"
              ></div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-4">Activity Breakdown</h2>
          
          {/* Daily Updates */}
          <div 
            className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-4 border-l-4 border-green-400 hover:scale-102 transition-transform duration-200"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 mr-4 bg-green-400 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Daily Updates</h3>
                <p className="text-sm text-gray-600">30 XP per update</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-green-600">{points.dailyUpdatePoints}</span>
                <span className="text-xs text-gray-500">XP earned</span>
              </div>
            </div>
          </div>
          
          {/* K-Sheets */}
          <div 
            className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 mb-4 border-l-4 border-orange-400 hover:scale-102 transition-transform duration-200"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 mr-4 bg-orange-400 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold">K-Sheets</h3>
                <p className="text-sm text-gray-600">100 XP per sheet</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-orange-600">{points.kSheetPoints}</span>
                <span className="text-xs text-gray-500">XP earned</span>
              </div>
            </div>
          </div>
          
          {/* Test Submissions */}
          <div 
            className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border-l-4 border-red-400 hover:scale-102 transition-transform duration-200"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 mr-4 bg-red-400 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Test Submissions</h3>
                <p className="text-sm text-gray-600">Up to 500 XP based on marks</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-red-600">{points.testPoints}</span>
                <span className="text-xs text-gray-500">XP earned</span>
              </div>
            </div>
          </div>
                    
          {/* Achievements Section */}
          <div className="mt-8 opacity-100 transition-opacity duration-1000">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Achievements</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className={`flex flex-col items-center ${points.dailyUpdatePoints >= 300 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${points.dailyUpdatePoints >= 300 ? 'bg-purple-500' : 'bg-gray-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <span className="mt-2 text-sm font-medium">Update Champion</span>
                <span className="text-xs text-gray-500">{points.dailyUpdatePoints >= 300 ? 'Achieved' : '10+ updates needed'}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getKSheetAchievementColor()}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="mt-2 text-sm font-medium">K-Sheet Master</span>
                <span className="text-xs text-gray-500">{getKSheetAchievementLabel()}</span>
              </div>
              
              <div className={`flex flex-col items-center ${points.testPoints >= 1000 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${points.testPoints >= 1000 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="mt-2 text-sm font-medium">Test Expert</span>
                <span className="text-xs text-gray-500">{points.testPoints >= 1000 ? 'Achieved' : 'Need 1000+ test points'}</span>
              </div>
            </div>
          </div>
          
          {/* Achievement levels explanation */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-2">K-Sheet Achievement Levels</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-amber-700 mr-2"></div>
                <span className="text-sm">Bronze: 20+ K-Sheets</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-400 mr-2"></div>
                <span className="text-sm">Silver: 50+ K-Sheets</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Gold: 100+ K-Sheets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainFrame>
  );
};

export default TeacherPoints;
