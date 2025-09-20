import React from "react";

const RoleCard = ({ 
    roleType, 
    isSelected, 
    onSelect, 
    title, 
    description, 
    icon, 
    colorScheme = "blue" 
}) => {
    const getColorClasses = () => {
        if (colorScheme === "emerald") {
            return {
                selected: "ring-4 ring-emerald-300 shadow-2xl",
                background: isSelected 
                    ? "bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:via-emerald-800/30 dark:to-teal-800/30"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 group-hover:from-emerald-50 group-hover:to-emerald-100 dark:group-hover:from-emerald-900/20 dark:group-hover:to-emerald-800/20",
                indicator: "bg-emerald-500",
                icon: isSelected 
                    ? "bg-emerald-500 shadow-lg" 
                    : "bg-emerald-200 dark:bg-emerald-700 group-hover:bg-emerald-400 group-hover:shadow-lg",
                iconText: isSelected ? "text-white" : "text-emerald-700 dark:text-emerald-200 group-hover:text-white",
                title: isSelected 
                    ? "text-emerald-800 dark:text-emerald-200" 
                    : "text-gray-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300",
                description: isSelected 
                    ? "text-emerald-700 dark:text-emerald-300" 
                    : "text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
            };
        } else {
            return {
                selected: "ring-4 ring-blue-300 shadow-2xl",
                background: isSelected 
                    ? "bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-900/40 dark:via-blue-800/30 dark:to-indigo-800/30"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20",
                indicator: "bg-blue-500",
                icon: isSelected 
                    ? "bg-blue-500 shadow-lg" 
                    : "bg-blue-200 dark:bg-blue-700 group-hover:bg-blue-400 group-hover:shadow-lg",
                iconText: isSelected ? "text-white" : "text-blue-700 dark:text-blue-200 group-hover:text-white",
                title: isSelected 
                    ? "text-blue-800 dark:text-blue-200" 
                    : "text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300",
                description: isSelected 
                    ? "text-blue-700 dark:text-blue-300" 
                    : "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
            };
        }
    };

    const colors = getColorClasses();

    return (
        <div
            className={`group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                isSelected ? colors.selected : "hover:shadow-xl"
            }`}
            onClick={() => onSelect(roleType)}
        >
            <div className={`h-64 p-6 ${colors.background}`}>
                {/* Selection Indicator */}
                {isSelected && (
                    <div className="absolute top-4 right-4">
                        <div className={`w-6 h-6 ${colors.indicator} rounded-full flex items-center justify-center`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col items-center text-center h-full justify-between">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${colors.icon}`}>
                        <svg className={`w-8 h-8 ${colors.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {icon}
                        </svg>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${colors.title}`}>
                            {title}
                        </h3>
                        <p className={`text-sm leading-relaxed px-2 ${colors.description}`}>
                            {description}
                        </p>
                    </div>
                    
                    {/* Short description restored */}
                    <div className="mt-4">
                        <p className={`text-sm leading-relaxed px-2 ${colors.description}`}>
                            {roleType === "TEACHER" 
                                ? "Create and manage classroom sessions, assignments, and student engagement tools"
                                : "Join interactive sessions, collaborate with peers, and access learning resources and assessments"
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleCard;