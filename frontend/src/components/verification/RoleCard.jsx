import React from "react";

const RoleCard = ({
  roleType,
  isSelected,
  onSelect,
  title,
  description,
  icon,
  colorScheme = "blue",
}) => {
  const getColorClasses = () => {
    if (colorScheme === "emerald") {
      return {
        border: isSelected 
          ? "border-2 border-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50" 
          : "border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600",
        background: "bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
        selectedBg: isSelected ? "bg-emerald-50 dark:bg-emerald-900/20" : "",
        icon: isSelected
          ? "bg-emerald-500 text-white"
          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white",
        title: isSelected
          ? "text-emerald-700 dark:text-emerald-300"
          : "text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
        description: "text-gray-600 dark:text-gray-400",
        checkIcon: "bg-emerald-500",
      };
    } else {
      return {
        border: isSelected 
          ? "border-2 border-blue-500 shadow-lg shadow-blue-200 dark:shadow-blue-900/50" 
          : "border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600",
        background: "bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10",
        selectedBg: isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "",
        icon: isSelected
          ? "bg-blue-500 text-white"
          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white",
        title: isSelected
          ? "text-blue-700 dark:text-blue-300"
          : "text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300",
        description: "text-gray-600 dark:text-gray-400",
        checkIcon: "bg-blue-500",
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={`group relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${colors.border} ${colors.background} ${colors.selectedBg} rounded-2xl`}
      onClick={() => onSelect(roleType)}
    >
      {/* Selection Check */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`w-8 h-8 ${colors.checkIcon} rounded-full flex items-center justify-center shadow-lg`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className="p-8 aspect-square flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${colors.icon}`}>
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>

        {/* Title */}
        <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${colors.title}`}>
          {title}
        </h3>

        {/* Short Description */}
        <p className={`text-sm leading-relaxed transition-colors duration-300 ${colors.description}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default RoleCard;
