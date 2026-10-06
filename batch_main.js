// assets/js/batch/batch_main.js
// Enhanced main module with comprehensive loss tracking

import { openAddBatchModal, addBatch } from './add_batch.js';
import { viewBatch } from './view_batch.js';
import { editBatch, updateBatch } from './edit_batch.js';
import { moveBatch, saveBatchLocation } from './move_batch.js';
import { recordMortality, saveMortality } from './record_mortality.js';
import { viewLossHistory, exportLossHistory } from './view_loss_history.js';
import { 
    closeModal, 
    showLoading, 
    hideLoading, 
    showNotification, 
    exportBatches,
    initializeStyles 
} from './batch_utils.js';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize styles
    initializeStyles();
    
    // Expose functions to global window object for inline onclick handlers
    window.batchModule = {
        // Add Batch
        openAddBatchModal,
        addBatch,
        
        // View Batch
        viewBatch,
        
        // Edit Batch
        editBatch,
        updateBatch,
        
        // Move Batch
        moveBatch,
        saveBatchLocation,
        
        // Record Mortality/Losses
        recordMortality,
        saveMortality,
        
        // Loss History
        viewLossHistory,
        exportLossHistory,
        
        // Utilities
        closeModal,
        showLoading,
        hideLoading,
        showNotification,
        exportBatches
    };
    
    console.log('✅ Enhanced Batch Management Module Loaded Successfully');
    console.log('📊 Loss Tracking Features: Mortality, Missing, Culled, Sold, Other');
});