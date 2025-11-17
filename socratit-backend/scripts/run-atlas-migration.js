/**
 * Script to run Atlas migration
 * This creates the knowledge graph tables in the database
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Running Atlas migration...\n');

// Change to backend directory
const backendDir = path.join(__dirname, '..');
process.chdir(backendDir);

// Run the migration
const migrationCommand = 'npx prisma migrate dev --name add_atlas_knowledge_graph';

exec(migrationCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Migration failed:');
    console.error(stderr || error.message);
    process.exit(1);
  }

  console.log(stdout);
  console.log('✅ Atlas migration completed successfully!');
  console.log('\nThe following tables were created:');
  console.log('  - ConceptTaxonomy');
  console.log('  - StudentConceptMastery');
  console.log('  - ConceptRelationship');
  console.log('  - ClassConcept');
  console.log('  - ConceptMilestone');
  console.log('  - ConceptPracticeLog');
  console.log('  - StudentGradeHistory');
  console.log('\n🎉 Atlas is ready to use!');
});
