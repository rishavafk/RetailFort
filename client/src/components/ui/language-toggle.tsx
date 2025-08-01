import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

type Language = "en" | "hi";

export default function LanguageToggle() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === "en" ? "hi" : "en";
    setCurrentLanguage(newLanguage);
    
    // Here you would typically:
    // 1. Update the app's language context
    // 2. Store preference in localStorage
    // 3. Update API calls to include language preference
    
    localStorage.setItem("preferred-language", newLanguage);
    
    // For now, we'll just update the document lang attribute
    document.documentElement.lang = newLanguage;
  };

  const getDisplayText = () => {
    return currentLanguage === "en" ? "हि/EN" : "EN/हि";
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="bg-white bg-opacity-20 text-white hover:bg-white hover:bg-opacity-30 px-3 py-1 h-auto text-sm font-medium"
      data-testid="button-language-toggle"
      title={currentLanguage === "en" ? "Switch to Hindi" : "Switch to English"}
    >
      <Globe className="h-3 w-3 mr-1" />
      {getDisplayText()}
    </Button>
  );
}
