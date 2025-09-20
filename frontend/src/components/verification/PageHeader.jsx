import React from "react";

const PageHeader = ({ title, subtitle, icon }) => {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="max-w-screen-xl mx-auto px-4 py-16">
                <div className="text-center">
                    {icon && (
                        <div className="mx-auto flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {icon}
                            </svg>
                        </div>
                    )}
                    <h1 className="text-4xl font-bold mb-4">{title}</h1>
                    {subtitle && <p className="text-blue-100 text-lg">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;