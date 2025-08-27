import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import cors from 'cors';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine data file path based on environment
// Use /data/db.json for Docker, ./data/db.json for local development
const isDocker = process.env.DOCKER_ENV === 'true' || fsSync.existsSync('/data');
const dataFilePath = process.env.DATA_FILE_PATH || (isDocker ? '/data/db.json' : path.join(__dirname, 'data', 'db.json'));

// Ensure data directory exists for local development
if (!isDocker) {
    const dataDir = path.dirname(dataFilePath);
    if (!fsSync.existsSync(dataDir)) {
        fsSync.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory:', dataDir);
    }
}

const getDefaultData = () => ({
    'loandash-dark-mode': true,
    'loandash-debts': [],
    'loandash-loans': [],
    'loandash-archived-debts': [],
    'loandash-archived-loans': [],
    'loandash-auto-archive': 'never',
    'loandash-default-currency': 'MAD',
    'loandash-notification-settings': {
        enabled: true,
        defaultReminderDays: 3,
        browserNotifications: true,
        emailNotifications: false
    }
});

// This function safely initializes or re-initializes the data file.
const initializeDataFile = async () => {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(getDefaultData(), null, 2), 'utf-8');
        console.log('Data file initialized/reset successfully at', dataFilePath);
        return getDefaultData();
    } catch (writeError) {
        console.error("FATAL: Could not write initial data file.", writeError);
        throw writeError; // Propagate error if we can't even write the initial file
    }
};

// This function safely reads the data file, and resets it if it's corrupt or missing.
const getSafeData = async () => {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        if (!fileContent) { // Handles empty file case
            console.warn('Data file is empty. Re-initializing.');
            return await initializeDataFile();
        }
        return JSON.parse(fileContent); // Tries to parse
    } catch (error) {
        // Catches file not found, or JSON.parse errors
        console.error('Could not read or parse data file, it might be corrupt. Re-initializing.', error);
        return await initializeDataFile();
    }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all data
app.get('/api/data', async (req, res) => {
    try {
        const data = await getSafeData();
        // Process auto-payments when data is retrieved
        let processedData = await processAutoPayments(data);
        // Save the processed data back to file if any auto-payments were made
        if (JSON.stringify(processedData) !== JSON.stringify(data)) {
            await fs.writeFile(dataFilePath, JSON.stringify(processedData, null, 2), 'utf-8');
        }
        res.json(processedData);
    } catch (error) {
        console.error('Error safely reading data file:', error);
        res.status(500).json({ error: 'Could not read data file.' });
    }
});

// API endpoint to save all data
app.post('/api/data', async (req, res) => {
    try {
        // Process auto-payments before saving
        let processedData = await processAutoPayments(req.body);
        await fs.writeFile(dataFilePath, JSON.stringify(processedData, null, 2), 'utf-8');
        res.status(200).json({ message: 'Data saved successfully.' });
    } catch (error) {
        console.error('Error writing to data file:', error);
        res.status(500).json({ error: 'Could not save data.' });
    }
});

// Function to process automatic payments for bank loans
const processAutoPayments = async (data) => {
    let processedData = { ...data };
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    let hasChanges = false;
    
    // Process debts with auto-payment enabled
    if (processedData['loandash-debts']) {
        const originalDebts = JSON.stringify(processedData['loandash-debts']);
        processedData['loandash-debts'] = processedData['loandash-debts'].map(debt => {
            // Only process bank loans with auto-payment enabled (handle both cases)
            if (debt.type === 'Bank Loan' && 
                (debt.paymentAutomation === 'Auto' || debt.paymentAutomation === 'auto') && 
                debt.status === 'active') {
                return processAutoPaymentForBankLoan(debt, today, now);
            }
            // Process recurring debts (Friend/Family Credit)
            else if (debt.type === 'Friend/Family Credit' && debt.isRecurring && debt.recurrenceSettings && debt.status === 'active') {
                return processRecurringDebtPayment(debt, today);
            }
            return debt;
        });
        
        // Check if any changes were made
        if (JSON.stringify(processedData['loandash-debts']) !== originalDebts) {
            hasChanges = true;
        }
    }

    // Process loans with recurring repayments
    if (processedData['loandash-loans']) {
        const originalLoans = JSON.stringify(processedData['loandash-loans']);
        processedData['loandash-loans'] = processedData['loandash-loans'].map(loan => {
            // Process recurring loans
            if (loan.isRecurring && loan.recurrenceSettings && loan.status === 'active') {
                return processRecurringLoanRepayment(loan, today);
            }
            return loan;
        });
        
        // Check if any changes were made
        if (JSON.stringify(processedData['loandash-loans']) !== originalLoans) {
            hasChanges = true;
        }
    }
    
    // Process auto-archiving for completed debts only if auto-archive is not 'never'
    if (processedData['loandash-auto-archive'] !== 'never') {
        const beforeArchiving = JSON.stringify(processedData);
        processedData = processAutoArchiving(processedData);
        if (JSON.stringify(processedData) !== beforeArchiving) {
            hasChanges = true;
        }
    }
    
    // Save changes if any auto-payments were processed
    if (hasChanges) {
        try {
            await fs.writeFile(dataFilePath, JSON.stringify(processedData, null, 2));
            console.log('Auto-payment data saved successfully');
        } catch (error) {
            console.error('Error saving auto-payment data:', error);
        }
    }
    
    return processedData;
};

// Function to process automatic archiving of completed debts
const processAutoArchiving = (data) => {
    // Get auto-archive setting (default to 'never' if not set)
    const autoArchiveSetting = data['loandash-auto-archive'] || 'never';
    
    // Only process if auto-archive is enabled
    if (autoArchiveSetting === 'never') {
        return data; // Return original data if auto-archive is never
    }
    
    let processedData = { ...data };
    
    // Initialize archived arrays if they don't exist
    if (!processedData['loandash-archived-debts']) {
        processedData['loandash-archived-debts'] = [];
    }
    if (!processedData['loandash-archived-loans']) {
        processedData['loandash-archived-loans'] = [];
    }
    
    let hasArchivedItems = false;
    
    // Process debts for auto-archiving
    if (processedData['loandash-debts']) {
        const activeDebts = [];
        
        processedData['loandash-debts'].forEach(debt => {
            const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            const totalOwed = debt.totalAmount + (debt.accruedInterest || 0);
            const isFullyPaid = totalPaid >= totalOwed;
            
            // Check if debt should be auto-archived
            if (debt.status === 'completed' || isFullyPaid) {
                // Update debt status to completed if it was just paid off
                if (isFullyPaid && debt.status !== 'completed') {
                    debt.status = 'completed';
                }
                
                // Determine if enough time has passed based on auto-archive setting
                let shouldArchive = false;
                const completionDate = getDebtCompletionDate(debt);
                const daysSinceCompletion = completionDate ? 
                    Math.floor((new Date() - completionDate) / (1000 * 60 * 60 * 24)) : 0;
                
                switch (autoArchiveSetting) {
                    case 'immediately':
                        shouldArchive = true;
                        break;
                    case '1day':
                        shouldArchive = daysSinceCompletion >= 1;
                        break;
                    case '7days':
                        shouldArchive = daysSinceCompletion >= 7;
                        break;
                    case '30days':
                        shouldArchive = daysSinceCompletion >= 30;
                        break;
                    default:
                        shouldArchive = false;
                }
                
                if (shouldArchive) {
                    // Mark debt as archived and add to archived list
                    const archivedDebt = {
                        ...debt,
                        status: 'completed', // Keep as completed, not archived
                        archivedDate: new Date().toISOString(),
                        autoArchived: true
                    };
                    
                    processedData['loandash-archived-debts'].push(archivedDebt);
                    hasArchivedItems = true;
                    
                    console.log(`Auto-archived completed debt: ${debt.name} (${autoArchiveSetting})`);
                } else {
                    // Keep in active list but mark as completed
                    activeDebts.push({
                        ...debt,
                        status: 'completed'
                    });
                }
            } else {
                // Keep active debts
                activeDebts.push(debt);
            }
        });
        
        processedData['loandash-debts'] = activeDebts;
    }
    
    // Process loans for auto-archiving (similar logic)
    if (processedData['loandash-loans']) {
        const activeLoans = [];
        
        processedData['loandash-loans'].forEach(loan => {
            const totalRepaid = loan.repayments ? loan.repayments.reduce((sum, p) => sum + p.amount, 0) : 0;
            const totalLoanAmount = loan.totalAmount + (loan.accruedInterest || 0);
            const isFullyRepaid = totalRepaid >= totalLoanAmount;
            
            // Check if loan should be auto-archived
            if (loan.status === 'completed' || isFullyRepaid) {
                // Update loan status to completed if it was just paid off
                if (isFullyRepaid && loan.status !== 'completed') {
                    loan.status = 'completed';
                }
                
                // Determine if enough time has passed based on auto-archive setting
                let shouldArchive = false;
                const completionDate = getLoanCompletionDate(loan);
                const daysSinceCompletion = completionDate ? 
                    Math.floor((new Date() - completionDate) / (1000 * 60 * 60 * 24)) : 0;
                
                switch (autoArchiveSetting) {
                    case 'immediately':
                        shouldArchive = true;
                        break;
                    case '1day':
                        shouldArchive = daysSinceCompletion >= 1;
                        break;
                    case '7days':
                        shouldArchive = daysSinceCompletion >= 7;
                        break;
                    case '30days':
                        shouldArchive = daysSinceCompletion >= 30;
                        break;
                    default:
                        shouldArchive = false;
                }
                
                if (shouldArchive) {
                    // Mark loan as archived and add to archived list
                    const archivedLoan = {
                        ...loan,
                        status: 'completed', // Keep as completed, not archived
                        archivedDate: new Date().toISOString(),
                        autoArchived: true
                    };
                    
                    processedData['loandash-archived-loans'].push(archivedLoan);
                    hasArchivedItems = true;
                    
                    console.log(`Auto-archived completed loan: ${loan.name} (${autoArchiveSetting})`);
                } else {
                    // Keep in active list but mark as completed
                    activeLoans.push({
                        ...loan,
                        status: 'completed'
                    });
                }
            } else {
                // Keep active loans
                activeLoans.push(loan);
            }
        });
        
        processedData['loandash-loans'] = activeLoans;
    }
    
    return processedData;
};

// Helper function to get debt completion date
const getDebtCompletionDate = (debt) => {
    if (!debt.payments || debt.payments.length === 0) {
        return null;
    }
    
    // Find the last payment date that made the debt fully paid
    const totalOwed = debt.totalAmount + (debt.accruedInterest || 0);
    let runningTotal = 0;
    
    for (const payment of debt.payments.sort((a, b) => new Date(a.date) - new Date(b.date))) {
        runningTotal += payment.amount;
        if (runningTotal >= totalOwed) {
            return new Date(payment.date);
        }
    }
    
    return null;
};

// Helper function to get loan completion date
const getLoanCompletionDate = (loan) => {
    if (!loan.repayments || loan.repayments.length === 0) {
        return null;
    }
    
    // Find the last payment date that made the loan fully repaid
    const totalLoanAmount = loan.totalAmount + (loan.accruedInterest || 0);
    let runningTotal = 0;
    
    for (const payment of loan.repayments.sort((a, b) => new Date(a.date) - new Date(b.date))) {
        runningTotal += payment.amount;
        if (runningTotal >= totalLoanAmount) {
            return new Date(payment.date);
        }
    }
    
    return null;
};

// Process auto-payment for Bank Loan
const processAutoPaymentForBankLoan = (debt, today, now) => {
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOwed = debt.totalAmount + (debt.accruedInterest || 0);
    const remaining = totalOwed - totalPaid;
    
    // If debt is already fully paid, mark as completed
    if (remaining <= 0) {
        debt.status = 'completed';
        debt.nextPaymentDate = undefined;
        debt.suggestedPaymentAmount = undefined;
        return debt;
    }
    
    // Calculate payment schedule based on start date and due date
    const startDate = new Date(debt.startDate);
    const dueDate = new Date(debt.dueDate);
    const totalDays = Math.ceil((dueDate - startDate) / (1000 * 60 * 60 * 24));
    const monthsToPayoff = Math.max(1, Math.ceil(totalDays / 30)); // At least 1 month
    
    // Use user-defined monthly payment amount if available, otherwise calculate
    const userDefinedMonthlyPayment = debt.recurrenceSettings?.paymentAmount || null;
    const suggestedMonthlyPayment = userDefinedMonthlyPayment || Math.ceil(totalOwed / monthsToPayoff);
    
    // Calculate next payment date based on monthly intervals from start date or first payment date
    let nextPaymentDate = new Date(debt.recurrenceSettings?.firstPaymentDate || debt.startDate);
    const autoPaymentCount = debt.payments.filter(p => p.notes && p.notes.includes('[Auto-Payment]')).length;
    
    // If this is the first payment, schedule it for the first payment date or today (whichever is later)
    if (autoPaymentCount === 0) {
        const firstPaymentDate = debt.recurrenceSettings?.firstPaymentDate ? 
            new Date(debt.recurrenceSettings.firstPaymentDate) : new Date(debt.startDate);
        nextPaymentDate = new Date(Math.max(firstPaymentDate.getTime(), today.getTime()));
    } else {
        // Schedule subsequent payments monthly from the first payment date
        const firstPaymentDate = debt.recurrenceSettings?.firstPaymentDate ? 
            new Date(debt.recurrenceSettings.firstPaymentDate) : new Date(debt.startDate);
        nextPaymentDate = new Date(firstPaymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + autoPaymentCount);
        
        // If the calculated date is in the past, move it to today
        if (nextPaymentDate < today) {
            nextPaymentDate = new Date(today);
        }
    }
    
    // Ensure we don't schedule beyond the due date
    if (nextPaymentDate > dueDate) {
        nextPaymentDate = new Date(dueDate);
    }
    
    // Set next payment time to 00:01 AM on the due date
    nextPaymentDate.setHours(0, 1, 0, 0);
    
    // Update debt with scheduling information
    debt.nextPaymentDate = nextPaymentDate.toISOString();
    debt.suggestedPaymentAmount = Math.min(suggestedMonthlyPayment, remaining);
    
    // Check if payment should be processed (due date has passed and it's after 00:01 AM)
    const paymentDueDate = new Date(nextPaymentDate);
    paymentDueDate.setHours(0, 1, 0, 0); // Set to 00:01 AM on due date
    
    if (now >= paymentDueDate) {
        // Check if we already have an auto-payment for this due date
        const hasPaymentForDueDate = debt.payments.some(p => {
            const paymentDate = new Date(p.date);
            const dueDateOnly = new Date(paymentDueDate);
            dueDateOnly.setHours(0, 0, 0, 0);
            paymentDate.setHours(0, 0, 0, 0);
            return paymentDate.getTime() === dueDateOnly.getTime() && 
                   p.notes && p.notes.includes('[Auto-Payment]');
        });
        
        if (!hasPaymentForDueDate) {
            const paymentAmount = Math.min(debt.suggestedPaymentAmount, remaining);
            
            // Create auto-payment with exact due date and time (00:01 AM)
            const autoPaymentDate = new Date(paymentDueDate);
            autoPaymentDate.setHours(0, 1, 0, 0); // Set to 00:01 AM
            
            const totalPaymentsNeeded = userDefinedMonthlyPayment ? 
                Math.ceil(totalOwed / userDefinedMonthlyPayment) : monthsToPayoff;
            
            const autoPayment = {
                id: generateUUID(),
                amount: paymentAmount,
                date: autoPaymentDate.toISOString(),
                method: 'Bank Transfer',
                isPartial: paymentAmount < remaining,
                notes: `[Auto-Payment] Monthly payment for bank loan (${autoPaymentCount + 1}/${totalPaymentsNeeded}) - Processed at 00:01 AM`
            };
            
            debt.payments.push(autoPayment);
            debt.lastAutoPaymentDate = autoPaymentDate.toISOString();
            
            // Calculate next payment date (one month from current payment due date)
            const newNextPaymentDate = new Date(paymentDueDate);
            newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + 1);
            newNextPaymentDate.setHours(0, 1, 0, 0); // Set to 00:01 AM
            
            // Ensure we don't schedule beyond the due date
            if (newNextPaymentDate > dueDate) {
                newNextPaymentDate.setTime(dueDate.getTime());
                newNextPaymentDate.setHours(0, 1, 0, 0);
            }
            
            debt.nextPaymentDate = newNextPaymentDate.toISOString();
            
            // Check if debt is now completed
            const newTotalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            if (newTotalPaid >= totalOwed) {
                debt.status = 'completed';
                debt.nextPaymentDate = undefined;
                debt.suggestedPaymentAmount = undefined;
            }
            
            console.log(`Auto-payment processed for bank loan: ${debt.name}, Amount: ${paymentAmount}, Processed at: ${autoPaymentDate.toISOString()}`);
        }
    }
    
    return debt;
};

// Process recurring debt payment (Friend/Family Credit)
const processRecurringDebtPayment = (debt, today) => {
    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = debt.totalAmount - totalPaid;
    
    // If debt is already fully paid, mark as completed
    if (remaining <= 0) {
        debt.status = 'completed';
        debt.nextPaymentDate = undefined;
        debt.suggestedPaymentAmount = undefined;
        return debt;
    }
    
    // Get recurrence settings
    const recurrenceType = debt.recurrenceSettings.type;
    const endDate = debt.recurrenceSettings.endDate ? new Date(debt.recurrenceSettings.endDate) : null;
    const maxOccurrences = debt.recurrenceSettings.maxOccurrences;
    
    // NEW: Get user-defined first payment date and amount
    const firstPaymentDate = debt.recurrenceSettings.firstPaymentDate ? 
        new Date(debt.recurrenceSettings.firstPaymentDate) : new Date(debt.startDate);
    const userDefinedPaymentAmount = debt.recurrenceSettings.paymentAmount || null;
    
    // Check if recurrence has ended
    if (endDate && today > endDate) {
        debt.status = 'completed';
        debt.nextPaymentDate = undefined;
        debt.suggestedPaymentAmount = undefined;
        return debt;
    }
    
    if (maxOccurrences && debt.payments.length >= maxOccurrences) {
        debt.status = 'completed';
        debt.nextPaymentDate = undefined;
        debt.suggestedPaymentAmount = undefined;
        return debt;
    }
    
    // Calculate payment frequency in days
    let daysBetweenPayments = 30; // Default to monthly
    
    switch (recurrenceType) {
        case 'daily':
            daysBetweenPayments = 1;
            break;
        case 'weekly':
            daysBetweenPayments = 7;
            break;
        case 'bi-weekly':
            daysBetweenPayments = 14;
            break;
        case 'monthly':
            daysBetweenPayments = 30;
            break;
        case 'quarterly':
            daysBetweenPayments = 90;
            break;
        case 'yearly':
            daysBetweenPayments = 365;
            break;
    }
    
    // Calculate suggested payment amount
    let suggestedPaymentAmount;
    
    if (userDefinedPaymentAmount) {
        // Use user-defined payment amount
        suggestedPaymentAmount = userDefinedPaymentAmount;
    } else {
        // Calculate based on total amount and expected payments
        const dueDate = new Date(debt.dueDate);
        const totalDays = Math.ceil((dueDate - firstPaymentDate) / (1000 * 60 * 60 * 24));
        let totalExpectedPayments = Math.max(1, Math.ceil(totalDays / daysBetweenPayments));
        
        // Apply maxOccurrences limit if specified
        if (maxOccurrences) {
            totalExpectedPayments = Math.min(totalExpectedPayments, maxOccurrences);
        }
        
        suggestedPaymentAmount = Math.ceil(debt.totalAmount / totalExpectedPayments);
    }
    
    // Calculate next payment date based on first payment date and recurrence
    let nextPaymentDate;
    const recurringPaymentCount = debt.payments.filter(p => p.notes && p.notes.includes('[Recurring Payment]')).length;
    
    if (recurringPaymentCount === 0) {
        // First payment: use user-defined first payment date or today (whichever is later)
        nextPaymentDate = new Date(Math.max(firstPaymentDate.getTime(), today.getTime()));
    } else {
        // Subsequent payments: calculate from first payment date + (count * interval)
        nextPaymentDate = new Date(firstPaymentDate);
        nextPaymentDate.setDate(nextPaymentDate.getDate() + (recurringPaymentCount * daysBetweenPayments));
        
        // If the calculated date is in the past, move it to today
        if (nextPaymentDate < today) {
            nextPaymentDate = new Date(today);
        }
    }
    
    // Ensure we don't schedule beyond the due date or end date
    const dueDate = new Date(debt.dueDate);
    if (nextPaymentDate > dueDate) {
        nextPaymentDate = new Date(dueDate);
    }
    if (endDate && nextPaymentDate > endDate) {
        nextPaymentDate = new Date(endDate);
    }
    
    // Update debt with scheduling information
    debt.nextPaymentDate = nextPaymentDate.toISOString();
    debt.suggestedPaymentAmount = Math.min(suggestedPaymentAmount, remaining);
    
    // Check if payment is due today or overdue
    if (nextPaymentDate <= today) {
        // Check if we already have a recurring payment for today
        const hasPaymentToday = debt.payments.some(p => {
            const paymentDate = new Date(p.date);
            return paymentDate.toDateString() === today.toDateString() && 
                   p.notes && p.notes.includes('[Recurring Payment]');
        });
        
        if (!hasPaymentToday) {
            const paymentAmount = Math.min(debt.suggestedPaymentAmount, remaining);
            
            // Create recurring payment
            const recurringPayment = {
                id: generateUUID(),
                amount: paymentAmount,
                date: today.toISOString(),
                method: 'Cash',
                isPartial: paymentAmount < remaining,
                notes: `[Recurring Payment] ${recurrenceType} payment (${recurringPaymentCount + 1}) - Amount: ${paymentAmount}`
            };
            
            debt.payments.push(recurringPayment);
            
            // Calculate next payment date from first payment date
            const newNextPaymentDate = new Date(firstPaymentDate);
            newNextPaymentDate.setDate(newNextPaymentDate.getDate() + ((recurringPaymentCount + 1) * daysBetweenPayments));
            
            // Ensure we don't schedule beyond the due date or end date
            if (newNextPaymentDate > dueDate) {
                newNextPaymentDate.setTime(dueDate.getTime());
            }
            if (endDate && newNextPaymentDate > endDate) {
                newNextPaymentDate.setTime(endDate.getTime());
            }
            
            debt.nextPaymentDate = newNextPaymentDate.toISOString();
            
            // Check if debt is now completed or if we've reached max occurrences
            const newTotalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            const newRecurringPaymentCount = debt.payments.filter(p => p.notes && p.notes.includes('[Recurring Payment]')).length;
            
            if (newTotalPaid >= debt.totalAmount || 
                (maxOccurrences && newRecurringPaymentCount >= maxOccurrences) ||
                (endDate && newNextPaymentDate >= endDate)) {
                debt.status = 'completed';
                debt.nextPaymentDate = undefined;
                debt.suggestedPaymentAmount = undefined;
            }
            
            console.log(`Recurring payment processed for debt: ${debt.name}, Amount: ${paymentAmount}, Type: ${recurrenceType}, Payment ${newRecurringPaymentCount}`);
        }
    }
    
    return debt;
};

// Process recurring loan repayments
const processRecurringLoanRepayment = (loan, today) => {
    const totalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = loan.totalAmount - totalRepaid;
    
    // If loan is already fully repaid, mark as completed
    if (remaining <= 0) {
        loan.status = 'completed';
        loan.nextPaymentDate = undefined;
        loan.suggestedPaymentAmount = undefined;
        return loan;
    }
    
    // Get recurrence settings
    const recurrenceType = loan.recurrenceSettings.type;
    const endDate = loan.recurrenceSettings.endDate ? new Date(loan.recurrenceSettings.endDate) : null;
    const maxOccurrences = loan.recurrenceSettings.maxOccurrences;
    
    // Get user-defined first payment date and amount
    const firstPaymentDate = loan.recurrenceSettings.firstPaymentDate ? 
        new Date(loan.recurrenceSettings.firstPaymentDate) : new Date(loan.startDate);
    const userDefinedPaymentAmount = loan.recurrenceSettings.paymentAmount || null;
    
    // Check if recurrence has ended
    if (endDate && today > endDate) {
        loan.status = 'completed';
        loan.nextPaymentDate = undefined;
        loan.suggestedPaymentAmount = undefined;
        return loan;
    }
    
    if (maxOccurrences && loan.repayments.length >= maxOccurrences) {
        loan.status = 'completed';
        loan.nextPaymentDate = undefined;
        loan.suggestedPaymentAmount = undefined;
        return loan;
    }
    
    // Calculate payment frequency in days
    let daysBetweenPayments = 30; // Default to monthly
    
    switch (recurrenceType) {
        case 'daily':
            daysBetweenPayments = 1;
            break;
        case 'weekly':
            daysBetweenPayments = 7;
            break;
        case 'bi-weekly':
            daysBetweenPayments = 14;
            break;
        case 'monthly':
            daysBetweenPayments = 30;
            break;
        case 'quarterly':
            daysBetweenPayments = 90;
            break;
        case 'yearly':
            daysBetweenPayments = 365;
            break;
    }
    
    // Calculate suggested payment amount
    let suggestedPaymentAmount;
    
    if (userDefinedPaymentAmount) {
        // Use user-defined payment amount
        suggestedPaymentAmount = userDefinedPaymentAmount;
    } else {
        // Calculate based on total amount and expected payments
        const dueDate = new Date(loan.dueDate);
        const totalDays = Math.ceil((dueDate - firstPaymentDate) / (1000 * 60 * 60 * 24));
        let totalExpectedPayments = Math.max(1, Math.ceil(totalDays / daysBetweenPayments));
        
        // Apply maxOccurrences limit if specified
        if (maxOccurrences) {
            totalExpectedPayments = Math.min(totalExpectedPayments, maxOccurrences);
        }
        
        suggestedPaymentAmount = Math.ceil(loan.totalAmount / totalExpectedPayments);
    }
    
    // Calculate next payment date based on first payment date and recurrence
    let nextPaymentDate;
    const recurringPaymentCount = loan.repayments.filter(p => p.notes && p.notes.includes('[Recurring Payment]')).length;
    
    if (recurringPaymentCount === 0) {
        // First payment: use user-defined first payment date or today (whichever is later)
        nextPaymentDate = new Date(Math.max(firstPaymentDate.getTime(), today.getTime()));
    } else {
        // Subsequent payments: calculate from first payment date + (count * interval)
        nextPaymentDate = new Date(firstPaymentDate);
        nextPaymentDate.setDate(nextPaymentDate.getDate() + (recurringPaymentCount * daysBetweenPayments));
        
        // If the calculated date is in the past, move it to today
        if (nextPaymentDate < today) {
            nextPaymentDate = new Date(today);
        }
    }
    
    // Ensure we don't schedule beyond the due date or end date
    const dueDate = new Date(loan.dueDate);
    if (nextPaymentDate > dueDate) {
        nextPaymentDate = new Date(dueDate);
    }
    if (endDate && nextPaymentDate > endDate) {
        nextPaymentDate = new Date(endDate);
    }
    
    // Update loan with scheduling information
    loan.nextPaymentDate = nextPaymentDate.toISOString();
    loan.suggestedPaymentAmount = Math.min(suggestedPaymentAmount, remaining);
    
    // Check if payment is due today or overdue
    if (nextPaymentDate <= today) {
        // Check if we already have a recurring payment for today
        const hasPaymentToday = loan.repayments.some(p => {
            const paymentDate = new Date(p.date);
            return paymentDate.toDateString() === today.toDateString() && 
                   p.notes && p.notes.includes('[Recurring Payment]');
        });
        
        if (!hasPaymentToday) {
            const paymentAmount = Math.min(loan.suggestedPaymentAmount, remaining);
            
            // Create recurring payment
            const recurringPayment = {
                id: generateUUID(),
                amount: paymentAmount,
                date: today.toISOString(),
                method: 'Bank Transfer',
                isPartial: paymentAmount < remaining,
                notes: `[Recurring Payment] ${recurrenceType} payment (${recurringPaymentCount + 1}) - Amount: ${paymentAmount}`
            };
            
            loan.repayments.push(recurringPayment);
            
            // Calculate next payment date from first payment date
            const newNextPaymentDate = new Date(firstPaymentDate);
            newNextPaymentDate.setDate(newNextPaymentDate.getDate() + ((recurringPaymentCount + 1) * daysBetweenPayments));
            
            // Ensure we don't schedule beyond the due date or end date
            if (newNextPaymentDate > dueDate) {
                newNextPaymentDate.setTime(dueDate.getTime());
            }
            if (endDate && newNextPaymentDate > endDate) {
                newNextPaymentDate.setTime(endDate.getTime());
            }
            
            loan.nextPaymentDate = newNextPaymentDate.toISOString();
            
            // Check if loan is now completed or if we've reached max occurrences
            const newTotalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
            const newRecurringPaymentCount = loan.repayments.filter(p => p.notes && p.notes.includes('[Recurring Payment]')).length;
            
            if (newTotalRepaid >= loan.totalAmount || 
                (maxOccurrences && newRecurringPaymentCount >= maxOccurrences) ||
                (endDate && newNextPaymentDate >= endDate)) {
                loan.status = 'completed';
                loan.nextPaymentDate = undefined;
                loan.suggestedPaymentAmount = undefined;
            }
            
            console.log(`Recurring payment processed for loan: ${loan.name}, Amount: ${paymentAmount}, Type: ${recurrenceType}, Payment ${newRecurringPaymentCount}`);
        }
    }
    
    return loan;
};

// Simple UUID generator for auto-payments
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// All other GET requests are sent to the React app's index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize and start the server
getSafeData().then(() => {
    app.listen(port, () => {
        console.log(`LoanDash server listening on port ${port}`);
        console.log(`Data is being stored at ${dataFilePath}`);
    });
}).catch(err => {
    console.error("Failed to initialize server on first run:", err);
    process.exit(1);
});
