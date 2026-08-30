export interface ClinicalQuestion {
  id: string;
  category: 'CHIEF_COMPLAINT' | 'HPI' | 'PAST_HISTORY' | 'MEDICATIONS' | 'ALLERGIES' | 'PERSONAL' | 'AYUSH' | 'RED_FLAG_CHECK';
  questionEn: string;
  questionHi: string;
  audioPromptEn?: string;
  audioPromptHi?: string;
  answerType: 'TEXT_VOICE' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'SLIDER' | 'SEVERITY_SCALE';
  options?: Array<{
    value: string;
    labelEn: string;
    labelHi: string;
    isRedFlag?: boolean;
    ayushDosha?: 'VATA' | 'PITTA' | 'KAPHA';
  }>;
  triggerCondition?: (answers: Record<string, string>) => boolean;
  nextQuestionId?: string;
  redFlagRule?: string;
}

export const CLINICAL_ONTOLOGY: Record<string, ClinicalQuestion[]> = {
  // 1. AYUSH HERO CASE: JOINT PAIN / SANDHIVATA
  SANDHIVATA_TREE: [
    {
      id: 'Q_KNEE_LOC',
      category: 'HPI',
      questionEn: 'Which joints are primarily painful or swollen?',
      questionHi: 'मुख्य रूप से किन जोड़ों में दर्द या सूजन है?',
      answerType: 'MULTI_SELECT',
      options: [
        { value: 'BILATERAL_KNEE', labelEn: 'Both Knees (Janu Sandhi)', labelHi: 'दोनों घुटने', ayushDosha: 'VATA' },
        { value: 'SINGLE_KNEE', labelEn: 'Single Knee Only', labelHi: 'केवल एक घुटना', ayushDosha: 'VATA' },
        { value: 'LOWER_BACK', labelEn: 'Lower Back / Spine (Kati)', labelHi: 'कमर / रीढ़', ayushDosha: 'VATA' },
        { value: 'SMALL_JOINTS', labelEn: 'Small Finger Joints (Hands/Feet)', labelHi: 'हाथ-पैर की छोटी अंगुलियां', ayushDosha: 'PITTA' },
        { value: 'SHOULDER_NECK', labelEn: 'Neck / Shoulders (Manya/Amsa)', labelHi: 'गर्दन / कंधे', ayushDosha: 'VATA' }
      ]
    },
    {
      id: 'Q_PAIN_SEVERITY',
      category: 'HPI',
      questionEn: 'How would you rate the pain on a scale of 1 to 10?',
      questionHi: 'दर्द की तीव्रता 1 से 10 के पैमाने पर कितनी है?',
      answerType: 'SEVERITY_SCALE',
      options: [
        { value: 'MILD_1_3', labelEn: '1-3: Mild (tolerable discomfort)', labelHi: '1-3: हल्का दर्द' },
        { value: 'MODERATE_4_6', labelEn: '4-6: Moderate (interferes with daily work)', labelHi: '4-6: मध्यम (काम में परेशानी)' },
        { value: 'SEVERE_7_8', labelEn: '7-8: Severe (difficulty walking)', labelHi: '7-8: तीव्र (चलने में भारी कठिनाई)' },
        { value: 'VERY_SEVERE_9_10', labelEn: '9-10: Excruciating / Bedridden', labelHi: '9-10: अत्यधिक तीव्र (बिस्तर से उठना मुश्किल)' }
      ]
    },
    {
      id: 'Q_MORNING_STIFFNESS',
      category: 'HPI',
      questionEn: 'Do you experience joint stiffness upon waking in the morning?',
      questionHi: 'क्या सुबह सोकर उठने पर जोड़ों में जकड़न (Stiffness) महसूस होती है?',
      answerType: 'SINGLE_SELECT',
      options: [
        { value: 'NONE', labelEn: 'No stiffness', labelHi: 'कोई जकड़न नहीं' },
        { value: 'UNDER_30_MIN', labelEn: 'Less than 30 minutes (Sandhivata type)', labelHi: '30 मिनट से कम (संधिवात)', ayushDosha: 'VATA' },
        { value: 'OVER_1_HOUR', labelEn: 'Prolonged > 1 hour (Amavata / Inflammatory type)', labelHi: '1 घंटे से अधिक (आमवात / रूमेटाइड)', ayushDosha: 'KAPHA' }
      ]
    },
    {
      id: 'Q_AGGRAVATING_FACTORS',
      category: 'HPI',
      questionEn: 'What makes your pain or stiffness worse?',
      questionHi: 'किन चीजों से आपका दर्द या जकड़न बढ़ जाती है?',
      answerType: 'MULTI_SELECT',
      options: [
        { value: 'COLD_WEATHER', labelEn: 'Cold weather / AC exposure (Shita Sparsha)', labelHi: 'ठंडा मौसम / ठंडी हवा', ayushDosha: 'VATA' },
        { value: 'STAIRS_WALKING', labelEn: 'Climbing stairs or prolonged walking', labelHi: 'सीढ़ियां चढ़ना या अधिक चलना', ayushDosha: 'VATA' },
        { value: 'REST_INACTIVITY', labelEn: 'Prolonged sitting / inactivity', labelHi: 'देर तक बैठे रहना', ayushDosha: 'KAPHA' },
        { value: 'SOUR_FERMENTED_FOOD', labelEn: 'Sour, curd or fermented foods', labelHi: 'खट्टा, दही या खमीर वाली चीजें', ayushDosha: 'PITTA' }
      ]
    },
    {
      id: 'Q_RELIEVING_FACTORS',
      category: 'HPI',
      questionEn: 'What provides you relief?',
      questionHi: 'किस उपाय से आपको आराम मिलता है?',
      answerType: 'MULTI_SELECT',
      options: [
        { value: 'WARMTH_OIL', labelEn: 'Warmth / warm oil massage (Snehana/Svedana)', labelHi: 'गर्म सिकाई या तेल की मालिश' },
        { value: 'REST', labelEn: 'Complete rest / lying down', labelHi: 'विश्राम / लेटने से' },
        { value: 'PAINKILLER_MEDS', labelEn: 'Allopathic painkillers (Paracetamol/NSAIDs)', labelHi: 'दर्द निवारक गोलियों से' },
        { value: 'MILD_MOVEMENT', labelEn: 'Gentle warm-up movements', labelHi: 'धीमी चहलकदमी से' }
      ]
    },
    {
      id: 'Q_CREPITUS_SWELLING',
      category: 'HPI',
      questionEn: 'Do you feel cracking sounds (Crepitus) or notice joint swelling?',
      questionHi: 'क्या जोड़ों से कट-कट की आवाज आती है या सूजन दिखाई देती है?',
      answerType: 'SINGLE_SELECT',
      options: [
        { value: 'CREPITUS_ONLY', labelEn: 'Cracking sounds while bending (Sandhi Sphutana)', labelHi: 'केवल कट-कट की आवाज (संधि स्फुटन)', ayushDosha: 'VATA' },
        { value: 'SWELLING_AND_HEAT', labelEn: 'Visible swelling with warm feeling (Shopha/Daha)', labelHi: 'सूजन और गर्माहट (शोफ/दाह)', ayushDosha: 'PITTA' },
        { value: 'BOTH', labelEn: 'Both sounds and swelling', labelHi: 'आवाज और सूजन दोनों', ayushDosha: 'VATA' },
        { value: 'NONE', labelEn: 'Neither', labelHi: 'इनमें से कोई नहीं' }
      ]
    }
  ],

  // 2. EMERGENCY RED-FLAG TREE: CHEST PAIN / CARDIOVASCULAR
  CHEST_PAIN_TREE: [
    {
      id: 'Q_CHEST_ONSET_NATURE',
      category: 'HPI',
      questionEn: 'How would you describe the chest discomfort?',
      questionHi: 'छाती में किस प्रकार की तकलीफ हो रही है?',
      answerType: 'SINGLE_SELECT',
      options: [
        { value: 'PRESSURE_HEAVY', labelEn: 'Heavy squeezing / crushing pressure (Elephant sitting on chest)', labelHi: 'भारी दबाव, निचोड़न या जकड़न', isRedFlag: true },
        { value: 'SHARP_STABBING', labelEn: 'Sharp stabbing pain changing with breathing', labelHi: 'सांस लेने पर तेज चुभने वाला दर्द' },
        { value: 'BURNING_ACIDIC', labelEn: 'Burning sensation behind breastbone (Acid Reflux / Amlapitta)', labelHi: 'छाती के बीच में जलन (खट्टी डकारें)' },
        { value: 'MUSCLE_SORE', labelEn: 'Muscle ache aggravated by pressing with finger', labelHi: 'मांसपेशियों का दर्द (दबाने पर बढ़ना)' }
      ]
    },
    {
      id: 'Q_CHEST_RADIATION',
      category: 'RED_FLAG_CHECK',
      questionEn: 'Does the pain spread or radiate to any of these areas?',
      questionHi: 'क्या यह दर्द कहीं और फैल रहा है?',
      answerType: 'MULTI_SELECT',
      options: [
        { value: 'LEFT_ARM_SHOULDER', labelEn: 'Left arm / shoulder', labelHi: 'बायां हाथ / बायां कंधा', isRedFlag: true },
        { value: 'JAW_NECK', labelEn: 'Jaw, neck or teeth', labelHi: 'जबड़ा, गर्दन या दांत', isRedFlag: true },
        { value: 'UPPER_BACK', labelEn: 'Upper back between shoulder blades', labelHi: 'पीठ के ऊपरी हिस्से में', isRedFlag: true },
        { value: 'NO_SPREAD', labelEn: 'Does not spread anywhere', labelHi: 'कहीं नहीं फैलता' }
      ]
    },
    {
      id: 'Q_CHEST_ASSOCIATED_SYMPTOMS',
      category: 'RED_FLAG_CHECK',
      questionEn: 'Are you experiencing any of the following right now?',
      questionHi: 'क्या आपको अभी इनमें से कोई लक्षण महसूस हो रहा है?',
      answerType: 'MULTI_SELECT',
      options: [
        { value: 'DYSPNEA_SHORT_BREATH', labelEn: 'Severe breathlessness / gasping for air', labelHi: 'सांस फूलना / सांस लेने में भारी तकलीफ', isRedFlag: true },
        { value: 'COLD_SWEATING', labelEn: 'Profuse cold sweating / clamminess (Diaphoresis)', labelHi: 'ठंडा पसीना छूटना / घबराहट', isRedFlag: true },
        { value: 'DIZZINESS_SYNCOPE', labelEn: 'Severe dizziness, fainting or loss of balance', labelHi: 'चक्कर आना या बेहोशी जैसा लगना', isRedFlag: true },
        { value: 'NONE_OF_ABOVE', labelEn: 'None of these', labelHi: 'इनमें से कोई नहीं' }
      ]
    }
  ],

  // 3. DIGESTIVE / AJEERNA & AMLAPITTA TREE
  DIGESTION_TREE: [
    {
      id: 'Q_DIGESTIVE_COMPLAINT',
      category: 'HPI',
      questionEn: 'What is the primary digestive issue?',
      questionHi: 'पेट या पाचन में मुख्य समस्या क्या है?',
      answerType: 'MULTI_SELECT',
      options: [
        { value: 'BLOATING_GAS', labelEn: 'Bloating & gas after meals (Anaha/Adhmana)', labelHi: 'खाने के बाद पेट फूलना और गैस', ayushDosha: 'VATA' },
        { value: 'HEARTBURN_SOUR', labelEn: 'Acid reflux / sour belching (Amlapitta/Tikta Udgara)', labelHi: 'खट्टी डकारें और सीने में जलन', ayushDosha: 'PITTA' },
        { value: 'SLUGGISH_HEAVY', labelEn: 'Heaviness in abdomen, lack of hunger (Agnimandya/Gaurava)', labelHi: 'भूख न लगना और भारीपन', ayushDosha: 'KAPHA' },
        { value: 'CONSTIPATION', labelEn: 'Hard stools / irregular bowel (Vibandha/Krura Koshtha)', labelHi: 'कब्ज / मल का कड़ा होना', ayushDosha: 'VATA' }
      ]
    },
    {
      id: 'Q_MEAL_TIMINGS',
      category: 'AYUSH',
      questionEn: 'How are your daily meal timings and water intake?',
      questionHi: 'आपके भोजन का समय और पानी पीने की आदत कैसी है?',
      answerType: 'SINGLE_SELECT',
      options: [
        { value: 'IRREGULAR_TIMINGS', labelEn: 'Irregular timings & frequent late night meals (Vishamashana)', labelHi: 'अनियमित समय और देर रात खाना' },
        { value: 'FIXED_TIMINGS', labelEn: 'Fixed, regular meal timings (Samashana)', labelHi: 'नियमित समय पर खाना' },
        { value: 'HEAVY_OILY_SNACKS', labelEn: 'Frequent fried, bakery or junk snacks', labelHi: 'तली-भुनी या पैकेज्ड चीजें अधिक खाना' }
      ]
    }
  ]
};

export const AYUSH_PRAKRITI_QUESTIONS: ClinicalQuestion[] = [
  {
    id: 'PQ_BODY_FRAME',
    category: 'AYUSH',
    questionEn: 'How is your natural physical body frame?',
    questionHi: 'आपकी स्वाभाविक शारीरिक बनावट कैसी है?',
    answerType: 'SINGLE_SELECT',
    options: [
      { value: 'VATA_FRAME', labelEn: 'Lean, thin, prominent joints, difficult to gain weight', labelHi: 'पतला-दुबला, हड्डियां उभरी हुई, वजन मुश्किल से बढ़ना', ayushDosha: 'VATA' },
      { value: 'PITTA_FRAME', labelEn: 'Medium build, balanced muscle tone, warm skin', labelHi: 'मध्यम बनावट, सुगठित शरीर, त्वचा गर्म', ayushDosha: 'PITTA' },
      { value: 'KAPHA_FRAME', labelEn: 'Broad, sturdy, well-developed, easily gains weight', labelHi: 'मजबूत, चौड़ा शरीर, वजन जल्दी बढ़ना', ayushDosha: 'KAPHA' }
    ]
  },
  {
    id: 'PQ_SKIN_HAIR',
    category: 'AYUSH',
    questionEn: 'How is your skin texture and hair quality?',
    questionHi: 'आपकी त्वचा और बालों की प्रकृति कैसी है?',
    answerType: 'SINGLE_SELECT',
    options: [
      { value: 'VATA_SKIN', labelEn: 'Dry, rough skin, cracked heels, dry hair', labelHi: 'रूखी, शुष्क त्वचा, फटी एड़ियां, सूखे बाल', ayushDosha: 'VATA' },
      { value: 'PITTA_SKIN', labelEn: 'Fair, warm, prone to moles/freckles, premature graying/hair loss', labelHi: 'गर्म, संवेदनशील त्वचा, तिल-मुंहासे, बाल समय से पहले सफेद', ayushDosha: 'PITTA' },
      { value: 'KAPHA_SKIN', labelEn: 'Thick, oily, soft, glowing skin, dense lustrous hair', labelHi: 'चिकनी, चमकदार, मुलायम त्वचा, घने मजबूत बाल', ayushDosha: 'KAPHA' }
    ]
  },
  {
    id: 'PQ_APPETITE_AGNI',
    category: 'AYUSH',
    questionEn: 'How is your appetite (Agni) and digestion?',
    questionHi: 'आपकी भूख (अग्नि) और पाचन की स्थिति कैसी है?',
    answerType: 'SINGLE_SELECT',
    options: [
      { value: 'VISHAMAGNI', labelEn: 'Variable: Sometimes very hungry, sometimes no appetite (Vata)', labelHi: 'अनियमित: कभी बहुत तेज भूख, कभी बिल्कुल नहीं (विषमाग्नि)', ayushDosha: 'VATA' },
      { value: 'TIKSHNAGNI', labelEn: 'Sharp: Cannot tolerate skipping meals, feels burning if late (Pitta)', labelHi: 'तीव्र: भूख सहन न होना, खाना छूटने पर जलन/गुस्सा (तीक्ष्णाग्नि)', ayushDosha: 'PITTA' },
      { value: 'MANDAGNI', labelEn: 'Slow/Heavy: Can easily skip meals, feels heavy after eating (Kapha)', labelHi: 'मन्द: कम भूख, खाना खाने पर देर तक भारीपन (मन्दाग्नि)', ayushDosha: 'KAPHA' }
    ]
  },
  {
    id: 'PQ_BOWEL_KOSHTHA',
    category: 'AYUSH',
    questionEn: 'What is your bowel habit pattern (Koshtha)?',
    questionHi: 'आपका पेट साफ होने का पैटर्न (कोष्ठ) कैसा है?',
    answerType: 'SINGLE_SELECT',
    options: [
      { value: 'KRURA_KOSHTHA', labelEn: 'Hard / Constipated: Stools dry, needs mild laxative (Krura Koshtha)', labelHi: 'कड़ा / कब्ज: मल सूखा, पेट साफ होने में कठिनाई (क्रूर कोष्ठ)', ayushDosha: 'VATA' },
      { value: 'MRIDU_KOSHTHA', labelEn: 'Soft / Loose: Loose motions easily triggered by warm milk (Mridu Koshtha)', labelHi: 'नरम / ढीला: हल्का सा दूध या फल लेने पर भी पेट तुरंत साफ (मृदु कोष्ठ)', ayushDosha: 'PITTA' },
      { value: 'MADHYAMA_KOSHTHA', labelEn: 'Regular & Moderate: Normal daily evacuation (Madhyama Koshtha)', labelHi: 'मध्यम / सामान्य: दिन में एक बार नियमित साफ (मध्यम कोष्ठ)', ayushDosha: 'KAPHA' }
    ]
  },
  {
    id: 'PQ_SLEEP_MENTAL',
    category: 'AYUSH',
    questionEn: 'How is your sleep and mind under stress?',
    questionHi: 'आपकी नींद और तनाव में मन की स्थिति कैसी रहती है?',
    answerType: 'SINGLE_SELECT',
    options: [
      { value: 'VATA_MIND', labelEn: 'Light, interrupted sleep, restless mind, anxious under stress', labelHi: 'हल्की नींद, जल्दी टूटना, बेचैन मन, चिंता की प्रवृत्ति', ayushDosha: 'VATA' },
      { value: 'PITTA_MIND', labelEn: 'Moderate sleep (6 hrs), sharp focused mind, irritable under stress', labelHi: 'मध्यम गहरी नींद, तेज बुद्धि, तनाव में जल्दी गुस्सा आना', ayushDosha: 'PITTA' },
      { value: 'KAPHA_MIND', labelEn: 'Deep, prolonged sleep, calm patient mind, slow to anger', labelHi: 'गहरी, लंबी नींद, शांत, धैर्यवान मन, आलस्य की प्रवृत्ति', ayushDosha: 'KAPHA' }
    ]
  }
];

export class ClinicalAIService {
  public static getInitialQuestions(chiefComplaint: string, isAyush: boolean): ClinicalQuestion[] {
    const lower = chiefComplaint.toLowerCase();
    
    // Check for cardiac / emergency signals in initial complaint
    if (lower.includes('chest') || lower.includes('heart') || lower.includes('chhati') || lower.includes('dil') || lower.includes('seene')) {
      return CLINICAL_ONTOLOGY.CHEST_PAIN_TREE;
    }
    
    if (lower.includes('joint') || lower.includes('knee') || lower.includes('ghutne') || lower.includes('dard') || lower.includes('sandhi') || lower.includes('pain') || lower.includes('stiffness')) {
      const questions = [...CLINICAL_ONTOLOGY.SANDHIVATA_TREE];
      if (isAyush) {
        questions.push(...AYUSH_PRAKRITI_QUESTIONS);
      }
      return questions;
    }

    if (lower.includes('gas') || lower.includes('stomach') || lower.includes('pet') || lower.includes('acidity') || lower.includes('digestion') || lower.includes('bloat')) {
      const questions = [...CLINICAL_ONTOLOGY.DIGESTION_TREE];
      if (isAyush) {
        questions.push(...AYUSH_PRAKRITI_QUESTIONS);
      }
      return questions;
    }

    // Default general tree
    const defaultTree: ClinicalQuestion[] = [
      {
        id: 'Q_GEN_DURATION',
        category: 'HPI',
        questionEn: 'How long have you been experiencing these symptoms?',
        questionHi: 'आपको यह तकलीफ कितने समय से हो रही है?',
        answerType: 'SINGLE_SELECT',
        options: [
          { value: 'HOURS_DAYS', labelEn: 'Less than 3 days (Acute)', labelHi: '3 दिन से कम (अचानक शुरू)' },
          { value: 'WEEKS_1_4', labelEn: '1 to 4 weeks (Subacute)', labelHi: '1 से 4 हफ्ते' },
          { value: 'MONTHS_1_6', labelEn: '1 to 6 months (Chronic)', labelHi: '1 से 6 महीने (पुरानी तकलीफ)' },
          { value: 'YEARS', labelEn: 'More than 1 year (Longstanding)', labelHi: '1 साल से अधिक' }
        ]
      },
      {
        id: 'Q_GEN_SEVERITY',
        category: 'HPI',
        questionEn: 'How severe is your discomfort?',
        questionHi: 'तकलीफ की गंभीरता कितनी है?',
        answerType: 'SEVERITY_SCALE',
        options: [
          { value: 'MILD', labelEn: 'Mild - manageable without affecting work', labelHi: 'हल्की - सामान्य काम जारी' },
          { value: 'MODERATE', labelEn: 'Moderate - limits daily physical activities', labelHi: 'मध्यम - दैनिक कार्यों में परेशानी' },
          { value: 'SEVERE', labelEn: 'Severe - requires immediate assistance', labelHi: 'गंभीर - तुरंत चिकित्सीय मदद जरूरी' }
        ]
      }
    ];

    if (isAyush) {
      defaultTree.push(...AYUSH_PRAKRITI_QUESTIONS);
    }
    return defaultTree;
  }

  public static calculatePrakriti(answers: Record<string, string>): {
    vata: number;
    pitta: number;
    kapha: number;
    dominant: 'VATA' | 'PITTA' | 'KAPHA' | 'VATA_PITTA' | 'PITTA_KAPHA' | 'VATA_KAPHA' | 'SAMA';
    agni: 'SAMAGNI' | 'MANDAGNI' | 'TIKSHNAGNI' | 'VISHAMAGNI';
    koshtha: 'MRIDU' | 'MADHYAMA' | 'KRURA';
  } {
    let vataScore = 20;
    let pittaScore = 20;
    let kaphaScore = 20;

    let agni: 'SAMAGNI' | 'MANDAGNI' | 'TIKSHNAGNI' | 'VISHAMAGNI' = 'VISHAMAGNI';
    let koshtha: 'MRIDU' | 'MADHYAMA' | 'KRURA' = 'KRURA';

    for (const [key, val] of Object.entries(answers)) {
      if (val.includes('VATA') || val === 'BILATERAL_KNEE' || val === 'COLD_WEATHER' || val === 'CREPITUS_ONLY') {
        vataScore += 25;
      }
      if (val.includes('PITTA') || val === 'SOUR_FERMENTED_FOOD' || val === 'SWELLING_AND_HEAT') {
        pittaScore += 25;
      }
      if (val.includes('KAPHA') || val === 'REST_INACTIVITY') {
        kaphaScore += 25;
      }

      if (val === 'VISHAMAGNI') agni = 'VISHAMAGNI';
      if (val === 'TIKSHNAGNI') agni = 'TIKSHNAGNI';
      if (val === 'MANDAGNI') agni = 'MANDAGNI';

      if (val === 'KRURA_KOSHTHA') koshtha = 'KRURA';
      if (val === 'MRIDU_KOSHTHA') koshtha = 'MRIDU';
      if (val === 'MADHYAMA_KOSHTHA') koshtha = 'MADHYAMA';
    }

    const total = vataScore + pittaScore + kaphaScore;
    const vataPct = Math.round((vataScore / total) * 100);
    const pittaPct = Math.round((pittaScore / total) * 100);
    const kaphaPct = 100 - (vataPct + pittaPct);

    let dominant: 'VATA' | 'PITTA' | 'KAPHA' | 'VATA_PITTA' | 'PITTA_KAPHA' | 'VATA_KAPHA' | 'SAMA' = 'VATA_PITTA';
    if (vataPct > 50 && pittaPct < 30 && kaphaPct < 30) dominant = 'VATA';
    else if (pittaPct > 50 && vataPct < 30 && kaphaPct < 30) dominant = 'PITTA';
    else if (kaphaPct > 50 && vataPct < 30 && pittaPct < 30) dominant = 'KAPHA';
    else if (vataPct >= 40 && pittaPct >= 30) dominant = 'VATA_PITTA';
    else if (vataPct >= 40 && kaphaPct >= 30) dominant = 'VATA_KAPHA';
    else if (pittaPct >= 40 && kaphaPct >= 30) dominant = 'PITTA_KAPHA';

    return {
      vata: vataPct,
      pitta: pittaPct,
      kapha: kaphaPct,
      dominant,
      agni,
      koshtha
    };
  }
}
