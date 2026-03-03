const BASE_URL = "https://raw.githubusercontent.com/ismailhamido11-art/pawcoach/main/src/assets/illustrations/";

const ILLUSTRATIONS = {
  adoptAPet: "adopt-a-pet.svg",
  goodDoggy: "good-doggy.svg",
  dogHighFive: "dog-high-five.svg",
  petFood: "pet-food.svg",
  dogWalking: "dog-walking.svg",
  veterinary: "veterinary.svg",
  petCare: "pet-care.svg",
  qualityTime: "quality-time-in-nature.svg",
  cautiousDog: "cautious-dog.svg",
};

export default function Illustration({ name, className = "", alt = "" }) {
  const file = ILLUSTRATIONS[name];
  if (!file) return null;
  return (
    <img
      src={BASE_URL + file}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
    />
  );
}

export { ILLUSTRATIONS };
