import React from "react";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ProfileImageOrInitials = ({
  src,
  alt,
  initials,
  name, // Add name prop as alternative to initials
  className = "w-10 h-10 rounded-full",
  avatarColorClass,
  textColorClass = "text-white",
  textSizeClass = "text-md",
}) => {
  const [imgError, setImgError] = React.useState(false);

  // Use provided initials or generate from name
  const displayInitials = initials || getInitials(name);

  if (!src || imgError) {
    return (
      <div
        className={`${className} flex items-center justify-center ${textColorClass} ${avatarColorClass || "bg-gray-400 dark:bg-gray-600"}`}
      >
        <span className={`${textSizeClass} font-semibold`}>
          {displayInitials}
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
