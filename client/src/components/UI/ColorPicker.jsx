import React from 'react';
import { motion } from 'framer-motion';

const COLORS = [
  { name: 'red', hex: '#EF4444', gradient: 'from-red-500 to-red-700', emoji: '🔴' },
  { name: 'blue', hex: '#3B82F6', gradient: 'from-blue-500 to-blue-700', emoji: '🔵' },
  { name: 'green', hex: '#22C55E', gradient: 'from-green-500 to-green-700', emoji: '🟢' },
  { name: 'yellow', hex: '#EAB308', gradient: 'from-yellow-500 to-yellow-600', emoji: '🟡' },
];

const ColorPicker = ({
  onSelectColor,
  onClose,
  title = 'Choose a Color',
  subtitle = 'Select the color for your wild card',
  allowCancel = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 50 }}
        transition={{ type: 'spring', damping: 15 }}
        className="glass p-8 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-center mb-2">{title}</h3>
        <p className="text-gray-400 text-center text-sm mb-6">{subtitle}</p>

        <div className="grid grid-cols-2 gap-4">
          {COLORS.map((color) => (
            <motion.button
              key={color.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectColor(color.name)}
              className={`bg-gradient-to-br ${color.gradient} 
                         p-6 rounded-2xl text-white font-bold text-lg
                         shadow-lg hover:shadow-xl transition-shadow duration-300
                         flex flex-col items-center gap-2 border-2 border-white/20
                         hover:border-white/50`}
            >
              <span className="text-3xl">{color.emoji}</span>
              <span className="uppercase tracking-wider text-sm">{color.name}</span>
            </motion.button>
          ))}
        </div>

        {allowCancel && (
          <button
            onClick={onClose}
            className="w-full mt-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ColorPicker;