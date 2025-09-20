import React from "react";
import RoleCard from "./RoleCard";
import AlertMessage from "./AlertMessage";

const RoleSelectionStep = ({ 
    selectedRole, 
    onRoleSelect, 
    onSubmit, 
    roleError, 
    loading 
}) => {
    const roles = [
        {
            type: "TEACHER",
            title: "Teacher",
            description: "Create and manage classroom sessions",
            colorScheme: "emerald",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            )
        },
        {
            type: "STUDENT",
            title: "Student",
            description: "Join sessions and collaborate with peers",
            colorScheme: "blue",
            icon: (
                <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </>
            )
        }
    ];

    return (
        <div>
            <div className="text-center mb-10">
                <div className="mx-auto flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Select Your Role</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">Choose how you want to use Classtro</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
                {roles.map((role) => (
                    <RoleCard
                        key={role.type}
                        roleType={role.type}
                        title={role.title}
                        description={role.description}
                        icon={role.icon}
                        colorScheme={role.colorScheme}
                        isSelected={selectedRole === role.type}
                        onSelect={onRoleSelect}
                    />
                ))}
            </div>
            
            <AlertMessage type="error" message={roleError} className="mb-4" />
            
            <button
                className="w-full inline-flex items-center justify-center px-5 py-3 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-base dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onSubmit}
                disabled={loading || !selectedRole}
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {loading ? "Saving..." : "Continue"}
            </button>
        </div>
    );
};

export default RoleSelectionStep;