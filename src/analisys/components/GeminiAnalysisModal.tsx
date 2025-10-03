import Spinner from "../../shared/components/Spinner";

interface GeminiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
  isLoading: boolean;
}
const GeminiAnalysisModal: React.FC<GeminiAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Análisis de Cartera con IA
          </h2>
          <button onClick={onClose} className="text-gray-400">
            &times;
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
            <p className="ml-4">Analizando...</p>
          </div>
        ) : (
          <div className="text-gray-300 space-y-4 whitespace-pre-wrap">
            {analysis.split("\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default GeminiAnalysisModal;
