CREATE TABLE `interactions` ( `id` INT NOT NULL AUTO_INCREMENT, `personId` INT NOT NULL, `userId` INT NOT NULL, `templateId` INT NOT NULL, `epiIds` JSON NULL, PRIMARY KEY (`id`), CONSTRAINT `fk_interactions_person` FOREIGN KEY (`personId`) REFERENCES `pessoa` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE, CONSTRAINT `fk_interactions_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE, CONSTRAINT `fk_interactions_file` FOREIGN KEY (`templateId`) REFERENCES `template` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;s