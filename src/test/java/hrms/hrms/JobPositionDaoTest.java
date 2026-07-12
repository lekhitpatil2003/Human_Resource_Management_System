package hrms.hrms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import hrms.hrms.entity.JobPosition;
import hrms.hrms.repository.JobPositionDao;
import jakarta.transaction.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class JobPositionDaoTest {
	
	@Autowired
    private JobPositionDao jobPositionDao;

    @Test
    void should_save_job_position_successfully() {
        JobPosition position = new JobPosition();
        position.setTitle("Software Engineer");

        JobPosition saved = jobPositionDao.save(position);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTitle()).isEqualTo("Software Engineer");
    }

    @Test
    void should_find_job_position_by_id() {
        JobPosition position = new JobPosition();
        position.setTitle("QA Engineer");

        JobPosition saved = jobPositionDao.save(position);

        Optional<JobPosition> result = jobPositionDao.findById(saved.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("QA Engineer");
    }

    @Test
    void should_return_empty_when_not_found() {
        Optional<JobPosition> result = jobPositionDao.findById(999);

        assertThat(result).isEmpty();
    }

    @Test
    void should_throw_exception_when_duplicate_title() {
        JobPosition position1 = new JobPosition();
        position1.setTitle("DevOps Engineer");

        jobPositionDao.saveAndFlush(position1);

        JobPosition position2 = new JobPosition();
        position2.setTitle("DevOps Engineer");

        assertThatThrownBy(() -> jobPositionDao.saveAndFlush(position2));
    }

}
