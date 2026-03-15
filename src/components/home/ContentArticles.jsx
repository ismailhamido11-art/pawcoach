import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

const ARTICLES = [
  {
    title: "5 plantes toxiques",
    subtitle: "A eviter en balade",
    img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&q=80",
    page: "Health",
  },
  {
    title: "Friandises maison",
    subtitle: "3 recettes faciles",
    img: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=300&q=80",
    page: "Nutrition",
  },
];

export default function ContentArticles({ dog }) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[17px] font-bold text-[#2D2D2D]">
          Pour {dog?.name || "ton chien"}
        </h3>
        <button className="text-[12px] text-[#2D9F82] font-medium flex items-center gap-0.5">
          Voir tout <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ARTICLES.map((article, i) => (
          <button
            key={i}
            onClick={() => navigate(createPageUrl(article.page))}
            className="bg-white rounded-2xl border border-[#E8E4DF] overflow-hidden text-left active:scale-[0.98] transition-transform"
          >
            <img
              src={article.img}
              alt={article.title}
              className="w-full h-20 object-cover"
            />
            <div className="p-3">
              <p className="text-[12px] font-semibold text-[#2D2D2D]">{article.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{article.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
