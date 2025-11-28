export interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  publisher: string;
  impactFactor: number;
  scope: string;
  subjects: string[];
  openAccess: boolean;
  reviewTime: string;
  acceptanceRate: number;
  website: string;
}

// Database of journals with their scope definitions
// In production, this would come from a database like PostgreSQL or MongoDB
export const journals: Journal[] = [
  {
    id: 'j1',
    name: 'Journal of Molecular Biology',
    abbreviation: 'JMB',
    publisher: 'Elsevier',
    impactFactor: 5.469,
    scope: 'Molecular biology, structural biology, biochemistry, molecular mechanisms of cellular processes, protein structure and function, nucleic acid biology, genomics and gene regulation.',
    subjects: ['Molecular Biology', 'Biochemistry', 'Structural Biology', 'Genomics'],
    openAccess: false,
    reviewTime: '6-8 weeks',
    acceptanceRate: 25,
    website: 'https://www.journals.elsevier.com/journal-of-molecular-biology'
  },
  {
    id: 'j2',
    name: 'PLOS ONE',
    abbreviation: 'PLOS ONE',
    publisher: 'Public Library of Science',
    impactFactor: 3.752,
    scope: 'Multidisciplinary research across all areas of science and medicine. Focus on methodological rigor and reproducibility rather than perceived impact.',
    subjects: ['Multidisciplinary', 'Biology', 'Medicine', 'Physical Sciences'],
    openAccess: true,
    reviewTime: '4-6 weeks',
    acceptanceRate: 55,
    website: 'https://journals.plos.org/plosone/'
  },
  {
    id: 'j3',
    name: 'Nature Communications',
    abbreviation: 'Nat Commun',
    publisher: 'Nature Publishing Group',
    impactFactor: 17.694,
    scope: 'High-quality research across all areas of biological, physical, chemical and earth sciences. Emphasis on significant advances and broad interest.',
    subjects: ['Multidisciplinary', 'Natural Sciences', 'Life Sciences', 'Physical Sciences'],
    openAccess: true,
    reviewTime: '8-12 weeks',
    acceptanceRate: 15,
    website: 'https://www.nature.com/ncomms/'
  },
  {
    id: 'j4',
    name: 'Journal of Pharmaceutical Sciences',
    abbreviation: 'J Pharm Sci',
    publisher: 'Wiley',
    impactFactor: 4.201,
    scope: 'Pharmaceutical sciences including drug discovery, drug delivery, pharmacokinetics, pharmacodynamics, formulation development, and pharmaceutical analysis.',
    subjects: ['Pharmaceutical Sciences', 'Drug Delivery', 'Pharmacology', 'Formulation'],
    openAccess: false,
    reviewTime: '4-8 weeks',
    acceptanceRate: 35,
    website: 'https://jpharmsci.org/'
  },
  {
    id: 'j5',
    name: 'Food Chemistry',
    abbreviation: 'Food Chem',
    publisher: 'Elsevier',
    impactFactor: 9.231,
    scope: 'Chemical aspects of food science, food analysis, food composition, food processing, food safety, and functional foods. Antioxidants, bioactive compounds, and nutraceuticals.',
    subjects: ['Food Science', 'Chemistry', 'Nutrition', 'Food Safety'],
    openAccess: false,
    reviewTime: '6-10 weeks',
    acceptanceRate: 20,
    website: 'https://www.journals.elsevier.com/food-chemistry'
  },
  {
    id: 'j6',
    name: 'Journal of Ethnopharmacology',
    abbreviation: 'J Ethnopharmacol',
    publisher: 'Elsevier',
    impactFactor: 5.195,
    scope: 'Traditional medicine, ethnopharmacology, medicinal plants, natural products, indigenous knowledge, phytotherapy, and ethnobotany research.',
    subjects: ['Ethnopharmacology', 'Traditional Medicine', 'Natural Products', 'Phytotherapy'],
    openAccess: false,
    reviewTime: '6-8 weeks',
    acceptanceRate: 30,
    website: 'https://www.journals.elsevier.com/journal-of-ethnopharmacology'
  },
  {
    id: 'j7',
    name: 'Phytomedicine',
    abbreviation: 'Phytomedicine',
    publisher: 'Elsevier',
    impactFactor: 6.656,
    scope: 'Phytotherapy, herbal medicine, medicinal plants, clinical studies of plant-based treatments, phytochemistry, and pharmacological activities of natural products.',
    subjects: ['Phytotherapy', 'Herbal Medicine', 'Clinical Trials', 'Pharmacology'],
    openAccess: false,
    reviewTime: '5-7 weeks',
    acceptanceRate: 25,
    website: 'https://www.journals.elsevier.com/phytomedicine'
  },
  {
    id: 'j8',
    name: 'Biomaterials',
    abbreviation: 'Biomaterials',
    publisher: 'Elsevier',
    impactFactor: 15.304,
    scope: 'Biomaterials science, tissue engineering, drug delivery systems, nanomedicine, biomedical devices, regenerative medicine, and materials-biology interfaces.',
    subjects: ['Biomaterials', 'Tissue Engineering', 'Drug Delivery', 'Nanomedicine'],
    openAccess: false,
    reviewTime: '6-10 weeks',
    acceptanceRate: 18,
    website: 'https://www.journals.elsevier.com/biomaterials'
  },
  {
    id: 'j9',
    name: 'Polymer',
    abbreviation: 'Polymer',
    publisher: 'Elsevier',
    impactFactor: 4.970,
    scope: 'Polymer science and engineering, polymer synthesis, polymer characterization, polymer physics, polymer processing, biopolymers, and advanced polymeric materials.',
    subjects: ['Polymer Science', 'Materials Science', 'Chemical Engineering', 'Biopolymers'],
    openAccess: false,
    reviewTime: '4-6 weeks',
    acceptanceRate: 40,
    website: 'https://www.journals.elsevier.com/polymer'
  },
  {
    id: 'j10',
    name: 'European Journal of Pharmaceutics and Biopharmaceutics',
    abbreviation: 'Eur J Pharm Biopharm',
    publisher: 'Elsevier',
    impactFactor: 5.589,
    scope: 'Pharmaceutical technology, biopharmaceutics, drug delivery, formulation science, pharmaceutical nanotechnology, and drug absorption studies.',
    subjects: ['Pharmaceutics', 'Biopharmaceutics', 'Drug Delivery', 'Nanotechnology'],
    openAccess: false,
    reviewTime: '5-8 weeks',
    acceptanceRate: 28,
    website: 'https://www.journals.elsevier.com/european-journal-of-pharmaceutics-and-biopharmaceutics'
  }
];

export function getAllJournals(): Journal[] {
  return journals;
}

export function getJournalById(id: string): Journal | undefined {
  return journals.find(j => j.id === id);
}
