import React from 'react';

interface InstructionVideoProps {
  videoId?: string;
  title?: string;
  description?: string;
}

export function InstructionVideo({
  videoId = "1G3QXgIT64H-tOZB2sNlqqm9oFcr3HgBm",
  title = "How to Use This Application",
  description = "Watch this quick tutorial to learn how to prepare your CSV input files and get the most out of the Template Analyst application."
}: InstructionVideoProps) {
  const fileId = videoId.split('/')[0];
  const videoUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
        <div className="aspect-video w-full">
          <iframe
            src={videoUrl}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Instruction Video"
          />
        </div>
      </div>
    </div>
  );
}