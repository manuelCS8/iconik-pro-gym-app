import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UploadProgressProps {
  progress: number;
  fileName?: string;
  fileSize?: number;
  status?: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  fileSize,
  status = 'uploading',
  errorMessage,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return '✅ Subida completada';
      case 'error':
        return '❌ Error en la subida';
      default:
        return '📤 Subiendo archivo...';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
      </View>

      {fileName && (
        <Text style={styles.fileName} numberOfLines={1}>
          📁 {fileName}
        </Text>
      )}

      {fileSize && (
        <Text style={styles.fileSize}>
          📏 {formatFileSize(fileSize)}
        </Text>
      )}

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${progress}%`,
              backgroundColor: getStatusColor(),
            }
          ]} 
        />
      </View>

      {status === 'error' && errorMessage && (
        <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default UploadProgress; 