-- AlterTable
ALTER TABLE `questions`
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `category_part` VARCHAR(120) NULL,
  ADD COLUMN `is_overall_satisfaction` BOOLEAN NOT NULL DEFAULT FALSE;

-- AlterTable
ALTER TABLE `feedback`
  ADD COLUMN `comments` TEXT NULL;

-- Backfill: mark existing matching overall question labels as overall satisfaction.
UPDATE `questions` q
JOIN (
  SELECT q2.`form_id`, MAX(q2.`display_order`) AS `max_display_order`
  FROM `questions` q2
  WHERE LOWER(TRIM(q2.`label`)) IN ('overall satisfaction', 'kinatibuk-ang katagbawan')
  GROUP BY q2.`form_id`
) marked
  ON q.`form_id` = marked.`form_id`
  AND q.`display_order` = marked.`max_display_order`
  AND LOWER(TRIM(q.`label`)) IN ('overall satisfaction', 'kinatibuk-ang katagbawan')
SET q.`is_overall_satisfaction` = TRUE;

-- Backfill: ensure each form has one final overall satisfaction question.
INSERT INTO `questions` (
  `form_id`,
  `type`,
  `label`,
  `description`,
  `category_part`,
  `is_overall_satisfaction`,
  `display_order`,
  `created_at`,
  `updated_at`
)
SELECT
  f.`form_id`,
  'smiley_rating',
  CASE
    WHEN LOWER(f.`language`) = 'bis' THEN 'Kinatibuk-ang Katagbawan'
    ELSE 'Overall Satisfaction'
  END,
  CASE
    WHEN LOWER(f.`language`) = 'bis' THEN 'Palihug i-rate ang imong kinatibuk-ang kasinatian.'
    ELSE 'Please rate your overall experience.'
  END,
  'Overall',
  TRUE,
  COALESCE(qmax.`max_order`, 0) + 1,
  NOW(),
  NOW()
FROM `forms` f
LEFT JOIN (
  SELECT `form_id`, MAX(`display_order`) AS `max_order`
  FROM `questions`
  GROUP BY `form_id`
) qmax ON qmax.`form_id` = f.`form_id`
WHERE NOT EXISTS (
  SELECT 1
  FROM `questions` oq
  WHERE oq.`form_id` = f.`form_id`
    AND oq.`is_overall_satisfaction` = TRUE
);