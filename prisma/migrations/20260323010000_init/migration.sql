CREATE TABLE `admins` (
  `admin_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`admin_id`),
  UNIQUE INDEX `admins_username_key` (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `personnel` (
  `personnel_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL,
  `password_expiry` TIMESTAMP(0) NULL,
  `profile_image` VARCHAR(255) NULL,
  `created_by_admin` INT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`personnel_id`),
  UNIQUE INDEX `personnel_email_key` (`email`),
  CONSTRAINT `personnel_created_by_admin_fkey`
    FOREIGN KEY (`created_by_admin`) REFERENCES `admins`(`admin_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `forms` (
  `form_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `language` VARCHAR(16) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_by_personnel_id` INT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`form_id`),
  INDEX `forms_created_by_personnel_id_idx` (`created_by_personnel_id`),
  CONSTRAINT `forms_created_by_personnel_id_fkey`
    FOREIGN KEY (`created_by_personnel_id`) REFERENCES `personnel`(`personnel_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `questions` (
  `question_id` INT NOT NULL AUTO_INCREMENT,
  `form_id` INT NOT NULL,
  `type` ENUM('smiley_rating') NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `display_order` INT NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`question_id`),
  INDEX `questions_form_id_display_order_idx` (`form_id`, `display_order`),
  CONSTRAINT `questions_form_id_fkey`
    FOREIGN KEY (`form_id`) REFERENCES `forms`(`form_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `feedback` (
  `feedback_id` INT NOT NULL AUTO_INCREMENT,
  `form_id` INT NOT NULL,
  `user_name` VARCHAR(100) NULL,
  `assisted_employee` VARCHAR(100) NULL,
  `submitted_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`feedback_id`),
  INDEX `feedback_form_id_submitted_at_idx` (`form_id`, `submitted_at`),
  CONSTRAINT `feedback_form_id_fkey`
    FOREIGN KEY (`form_id`) REFERENCES `forms`(`form_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `responses` (
  `response_id` INT NOT NULL AUTO_INCREMENT,
  `feedback_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer_value` TINYINT NOT NULL,
  PRIMARY KEY (`response_id`),
  INDEX `responses_question_id_idx` (`question_id`),
  CONSTRAINT `responses_feedback_id_fkey`
    FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`feedback_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `responses_question_id_fkey`
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `sessions` (
  `session_id` INT NOT NULL AUTO_INCREMENT,
  `token_id` VARCHAR(128) NOT NULL,
  `role` ENUM('admin', 'personnel') NOT NULL,
  `admin_id` INT NULL,
  `personnel_id` INT NULL,
  `expires_at` TIMESTAMP(0) NOT NULL,
  `revoked_at` TIMESTAMP(0) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`session_id`),
  UNIQUE INDEX `sessions_token_id_key` (`token_id`),
  INDEX `sessions_role_idx` (`role`),
  INDEX `sessions_expires_at_idx` (`expires_at`),
  CONSTRAINT `sessions_admin_id_fkey`
    FOREIGN KEY (`admin_id`) REFERENCES `admins`(`admin_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `sessions_personnel_id_fkey`
    FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`personnel_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `password_history` (
  `password_history_id` INT NOT NULL AUTO_INCREMENT,
  `personnel_id` INT NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`password_history_id`),
  INDEX `password_history_personnel_id_idx` (`personnel_id`),
  CONSTRAINT `password_history_personnel_id_fkey`
    FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`personnel_id`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `audit_logs` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `actor_role` ENUM('admin', 'personnel', 'kiosk', 'system') NOT NULL,
  `actor_id` INT NULL,
  `action_type` VARCHAR(120) NOT NULL,
  `target_type` VARCHAR(120) NOT NULL,
  `target_id` INT NULL,
  `metadata_json` JSON NULL,
  `occurred_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`log_id`),
  INDEX `audit_logs_occurred_at_idx` (`occurred_at`),
  INDEX `audit_logs_action_type_idx` (`action_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;
