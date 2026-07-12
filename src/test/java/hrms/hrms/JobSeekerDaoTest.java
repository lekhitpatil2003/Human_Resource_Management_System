package hrms.hrms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import hrms.hrms.entity.JobSeeker;
import hrms.hrms.repository.JobSeekerDao;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class JobSeekerDaoTest {
	
    @Autowired
    private JobSeekerDao jobSeekerDao;

    private JobSeeker validJobSeeker(String email, String nationalId) {
        JobSeeker js = new JobSeeker();
        js.setName("Aysu");
        js.setLastName("Ay");
        js.setNationalId(nationalId);
        js.setBirthDate(LocalDate.of(2000, 6, 6));
        js.setEmail(email);
        js.setPassword("password123");
        return js;
    }

    @Test
    void whenValidJobSeeker_thenSaved() {
        JobSeeker saved = jobSeekerDao.save(
            validJobSeeker("aysu@test.com", "12345678901"));
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Aysu");
    }

    @Test
    void whenDuplicateEmail_thenThrowsException() {
        jobSeekerDao.save(
            validJobSeeker("duplicate@test.com", "12345678901"));
        jobSeekerDao.flush();

        assertThrows(DataIntegrityViolationException.class, () -> {
            jobSeekerDao.save(
                validJobSeeker("duplicate@test.com", "98765432109"));
            jobSeekerDao.flush();
        });
    }

    @Test
    void whenDuplicateNationalId_thenThrowsException() {
        jobSeekerDao.save(
            validJobSeeker("first@test.com", "11111111111"));
        jobSeekerDao.flush();

        assertThrows(DataIntegrityViolationException.class, () -> {
            jobSeekerDao.save(
                validJobSeeker("second@test.com", "11111111111"));
            jobSeekerDao.flush();
        });
    }


}
