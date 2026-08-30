export interface Translations {
  appName: string;
  appSubtitle: string;
  demoEnvironmentBadge: string;
  existingPatient: string;
  newPatient: string;
  emergencyHelp: string;
  abhaVerificationTitle: string;
  enterAbhaNumber: string;
  scanQrCode: string;
  useDemoPatient: string;
  consentTitle: string;
  consentSubtitle: string;
  whatCollected: string;
  whatUsedFor: string;
  whatNotHappen: string;
  acceptAndContinue: string;
  declineConsent: string;
  selectHospital: string;
  selectDepartment: string;
  selectDoctor: string;
  selectSlot: string;
  patientDetails: string;
  clinicalIntake: string;
  voiceGuidance: string;
  listening: string;
  iHeard: string;
  tapToSpeak: string;
  correctAnswer: string;
  tryAgain: string;
  ayushAssessment: string;
  dashavidhaPariksha: string;
  uploadDocuments: string;
  ocrProcessing: string;
  aiSummaryTitle: string;
  aiSummaryDisclaimer: string;
  tokenAssigned: string;
  estimatedWait: string;
  doctorDashboard: string;
  physicianVerified: string;
  consultationSummary: string;
  prescription: string;
  redFlagAlert: string;
  impactCalculator: string;
}

export const translations: Record<'en' | 'hi', Translations> = {
  en: {
    appName: 'MediKiosk AI',
    appSubtitle: 'Clinical Pre-Intake & Case-Taking Platform',
    demoEnvironmentBadge: 'Demo Environment — Simulated ABDM & HIS Integration',
    existingPatient: 'Existing Patient (ABHA Linked)',
    newPatient: 'New Patient Registration',
    emergencyHelp: 'Emergency / Need Immediate Help',
    abhaVerificationTitle: 'ABHA Identity Verification',
    enterAbhaNumber: 'Enter 14-digit ABHA Number',
    scanQrCode: 'Scan ABHA / Ayushman Bharat QR',
    useDemoPatient: 'Use Hero Demo Patient (Smt. Radha Sharma)',
    consentTitle: 'Informed Consent for AI-Assisted Clinical Intake',
    consentSubtitle: 'Under the Digital Personal Data Protection (DPDP) Act 2023',
    whatCollected: 'What information will be collected?',
    whatUsedFor: 'How will your information be used?',
    whatNotHappen: 'What will NOT happen (Clinical Safety Guarantee)?',
    acceptAndContinue: 'I Understand & Give Consent',
    declineConsent: 'Decline / Continue Manually',
    selectHospital: 'Select Healthcare Institution',
    selectDepartment: 'Select Clinical / AYUSH Department',
    selectDoctor: 'Select Consulting Vaidya / Physician',
    selectSlot: 'Select Appointment Slot',
    patientDetails: 'Patient Demographic Profile',
    clinicalIntake: 'AI-Assisted Clinical Case-Taking',
    voiceGuidance: 'Audio guidance enabled. You may speak in your mother tongue or touch options below.',
    listening: 'Listening to your voice...',
    iHeard: 'I heard you say:',
    tapToSpeak: 'Tap Microphone & Speak',
    correctAnswer: 'Correct / Confirm',
    tryAgain: 'Clear & Speak Again',
    ayushAssessment: 'AYUSH Dashavidha Pariksha & Prakriti Assessment',
    dashavidhaPariksha: 'Ten-Fold Clinical Examination & Agni/Koshtha Evaluation',
    uploadDocuments: 'Upload Previous Medical Records (Prescription, CBC, Discharge)',
    ocrProcessing: 'AI Document Intelligence & Medical Entity Extraction',
    aiSummaryTitle: 'AI-Generated Structured Clinical Summary Draft',
    aiSummaryDisclaimer: 'AI-generated draft — requires mandatory physician review and verification.',
    tokenAssigned: 'Appointment Confirmed & Token Assigned',
    estimatedWait: 'Approximate Waiting Time',
    doctorDashboard: 'Clinical Workstation & Consultation Suite',
    physicianVerified: 'Physician Verified & Approved',
    consultationSummary: 'Final Consultation & Clinical Prescription Record',
    prescription: 'Medications & ChikitsaSutra Prescription',
    redFlagAlert: 'Critical Emergency Triage Alert',
    impactCalculator: 'OPD Clinical Workflow & Time-Saving Impact Simulator'
  },
  hi: {
    appName: 'मेडीकियोस्क एआई',
    appSubtitle: 'एआई-संचालित क्लिनिकल केस-टेकिंग और परामर्श पूर्व जांच',
    demoEnvironmentBadge: 'डेमो वातावरण — आयुष मंत्रालय / एम्स परीक्षण',
    existingPatient: 'पुराने मरीज (आभा लिंक)',
    newPatient: 'नया मरीज पंजीकरण',
    emergencyHelp: 'आपातकालीन / तुरंत डॉक्टर सहायता',
    abhaVerificationTitle: 'आभा (ABHA) पहचान सत्यापन',
    enterAbhaNumber: '14 अंकों का आभा नंबर दर्ज करें',
    scanQrCode: 'आभा / आयुष्मान भारत क्यूआर स्कैन करें',
    useDemoPatient: 'डेमो मरीज चुनें (श्रीमती राधा शर्मा - घुटना दर्द)',
    consentTitle: 'एआई क्लिनिकल केस-टेकिंग हेतु सूचित सहमति',
    consentSubtitle: 'डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के तहत',
    whatCollected: 'आपकी कौन सी जानकारी ली जाएगी?',
    whatUsedFor: 'इस जानकारी का उपयोग कैसे होगा?',
    whatNotHappen: 'क्या नहीं होगा (क्लिनिकल सुरक्षा गारंटी)?',
    acceptAndContinue: 'मैं समझ गया/गई हूँ, सहमति प्रदान करता/करती हूँ',
    declineConsent: 'अस्वीकार करें / सामान्य पर्ची बनवाएं',
    selectHospital: 'अस्पताल / संस्थान चुनें',
    selectDepartment: 'विभाग चुनें (आयुर्वेद / कायचिकित्सा / सामान्य)',
    selectDoctor: 'परामर्शदाता वैद्य / डॉक्टर चुनें',
    selectSlot: 'अपॉइंटमेंट समय चुनें',
    patientDetails: 'मरीज का व्यक्तिगत विवरण',
    clinicalIntake: 'एआई-सहायक क्लिनिकल इतिहास एवं पूछताछ',
    voiceGuidance: 'ऑडियो मार्गदर्शन चालू है। आप अपनी भाषा में बोल सकते हैं या स्क्रीन पर विकल्प छू सकते हैं।',
    listening: 'आपकी आवाज सुनी जा रही है...',
    iHeard: 'मैंने सुना:',
    tapToSpeak: 'माइक दबाएं और बोलें',
    correctAnswer: 'सही है / आगे बढ़ें',
    tryAgain: 'दोबारा बोलें',
    ayushAssessment: 'आयुष दशविध परीक्षा एवं प्रकृति विश्लेषण',
    dashavidhaPariksha: 'दशविध परीक्षा एवं अग्नि / कोष्ठ मूल्यांकन',
    uploadDocuments: 'पुराने मेडिकल दस्तावेज अपलोड करें (पर्चा, सीबीसी, डिस्चार्ज)',
    ocrProcessing: 'एआई दस्तावेज विश्लेषण एवं मेडिकल जांच निष्कर्षण',
    aiSummaryTitle: 'एआई द्वारा तैयार संरचित क्लिनिकल सारांश (प्रारूप)',
    aiSummaryDisclaimer: 'एआई-जनित प्रारूप — डॉक्टर द्वारा पुष्टि और सत्यापन अनिवार्य है।',
    tokenAssigned: 'अपॉइंटमेंट पक्की हुई एवं टोकन नंबर मिला',
    estimatedWait: 'अनुमानित प्रतीक्षा समय',
    doctorDashboard: 'डॉक्टर क्लिनिकल वर्कस्टेशन',
    physicianVerified: 'डॉक्टर द्वारा सत्यापित एवं स्वीकृत',
    consultationSummary: 'अंतिम परामर्श एवं चिकित्सा पर्ची',
    prescription: 'दवाएं एवं चिकित्सा सूत्र',
    redFlagAlert: 'आपातकालीन रेड-फ्लैग अलर्ट',
    impactCalculator: 'ओपीडी कार्यकुशलता एवं समय बचत कैलकुलेटर'
  }
};
