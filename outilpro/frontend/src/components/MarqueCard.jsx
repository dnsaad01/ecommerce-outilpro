import { Link } from 'react-router-dom';
import ImagePlaceholder from './ImagePlaceholder';

function MarqueCard({ marque }) {
    return (
        <Link
            to={`/catalogue?marqueId=${marque.id}`}
            className="group block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden flex items-center justify-center p-6">
                {marque.logoUrl ? (
                    <img
                        src={marque.logoUrl}
                        alt={marque.nom}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                ) : (
                    <ImagePlaceholder />
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-center group-hover:text-orange-600 transition-colors">
                    {marque.nom}
                </h3>
            </div>
        </Link>
    );
}

export default MarqueCard;
