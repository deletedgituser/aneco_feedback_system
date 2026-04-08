-- AlterTable: Make answerValue nullable to allow unanswered questions
ALTER TABLE `responses`
  MODIFY `answer_value` TINYINT NULL;
