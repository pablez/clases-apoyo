export default function LoadingSpinner({ message = 'Cargando...', size = 'medium' }) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div class="flex flex-col items-center justify-center py-12 space-y-4">
      <div class="relative">
        <div class={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class={`${sizeClasses[size]} opacity-20 bg-blue-100 rounded-full animate-pulse`}></div>
        </div>
      </div>
      {message && (
        <div class="text-center">
          <p class="text-gray-600 font-medium animate-pulse">{message}</p>
          <div class="flex justify-center gap-1 mt-2">
            <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
          </div>
        </div>
      )}
    </div>
  );
}
