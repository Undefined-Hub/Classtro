import React from "react";

const ProfileImageOrInitials = ({ 
  src, 
  alt, 
  initials, 
  className = "w-10 h-10 rounded-full", 
  avatarColorClass,
  textColorClass = "text-white" 
}) => {
  const [imgError, setImgError] = React.useState(false);

  if (!src || imgError) {
    return (
      <div
        className={`${className} flex items-center justify-center ${textColorClass} ${avatarColorClass || 'bg-gray-400 dark:bg-gray-600'}`}
      >
        <span className="text-md font-semibold">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-full"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

export default ProfileImageOrInitials;